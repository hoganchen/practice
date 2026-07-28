package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/mxschmitt/playwright-go"
	"golang.org/x/net/publicsuffix"
)

// ──────────────────────────────────────────────
// 东方财富 K 线数据爬虫（Go + 浏览器杂交）
// ──────────────────────────────────────────────

type EastMoneyCrawler struct {
	httpClient *http.Client
	pw         *playwright.Playwright
	browser    playwright.Browser
	utToken    string // 从页面提取的动态 Token
	mu         sync.RWMutex
}

// 初始化爬虫
func NewEastMoneyCrawler() (*EastMoneyCrawler, error) {
	// 1. 启动 Playwright
	pw, err := playwright.Run()
	if err != nil {
		return nil, fmt.Errorf("启动 Playwright 失败: %w", err)
	}

	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(true), // 这里可以无头，东财不查浏览器指纹
		Args: []string{
			"--disable-blink-features=AutomationControlled",
			"--no-sandbox",
		},
	})
	if err != nil {
		return nil, fmt.Errorf("启动浏览器失败: %w", err)
	}

	// 2. Go HTTP 客户端（复用 CookieJar）
	jar, _ := cookiejar.New(&cookiejar.Options{
		PublicSuffixList: publicsuffix.List,
	})
	client := &http.Client{
		Timeout: 30 * time.Second,
		Jar:     jar,
		Transport: &http.Transport{
			MaxIdleConns:        50,
			MaxIdleConnsPerHost: 10,
			IdleConnTimeout:     60 * time.Second,
			// 可选：用 utls 替换标准 tls，防 TLS 指纹检测
			// TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 3 {
				return http.ErrUseLastResponse
			}
			return nil
		},
	}

	return &EastMoneyCrawler{
		httpClient: client,
		pw:         pw,
		browser:    browser,
	}, nil
}

// ─── 浏览器任务 ──────────────────────────────────

// InitCredentials 浏览器访问东方财富首页，提取 ut Token 和 Cookie
func (c *EastMoneyCrawler) InitCredentials() error {
	log.Println("🌐 浏览器正在访问东方财富首页，获取 Credentials...")

	page, err := c.browser.NewPage(playwright.BrowserNewPageOptions{
		UserAgent: playwright.String("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
			"(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"),
	})
	if err != nil {
		return err
	}
	defer page.Close()

	// 模拟真实浏览行为，先访问首页拿到 Cookie 和 ut Token
	if _, err := page.Goto("https://quote.eastmoney.com/", playwright.PageGotoOptions{
		WaitUntil: playwright.WaitUntilStateNetworkidle,
		Timeout:   playwright.Float(30000),
	}); err != nil {
		return fmt.Errorf("访问首页失败: %w", err)
	}

	// 等待一下确保 JS 执行完成
	time.Sleep(3 * time.Second)

	// === 提取 ut Token ===
	// 东财的 ut Token 存在页面的 JS 变量里，或者某个 script 标签中
	// 常见方式：搜索 "ut=" 或 "global_ut"
	token, err := page.Evaluate(`() => {
		// 方法1：从 window 全局变量找
		if (window.ut) return window.ut;
		// 方法2：从 localStorage 找
		try {
			let keys = Object.keys(localStorage);
			for (let k of keys) {
				if (k.includes('ut') || k.includes('token')) {
					return localStorage.getItem(k);
				}
			}
		} catch(e) {}
		// 方法3：从页面 script 内容中正则匹配
		let scripts = document.querySelectorAll('script');
		for (let s of scripts) {
			let m = s.textContent.match(/["']ut["']\s*[:=]\s*["']([^"']+)["']/);
			if (m) return m[1];
		}
		return null;
	}()`)
	if err == nil && token != nil && token != "" {
		c.mu.Lock()
		c.utToken = fmt.Sprintf("%v", token)
		c.mu.Unlock()
		log.Printf("🔑 提取到 ut Token: %s", c.utToken)
	} else {
		// 如果提取不到，使用一个已知有效的默认值（有失效风险）
		c.mu.Lock()
		c.utToken = "fa5fd1943c7b386f172d6893dbfba10b"
		c.mu.Unlock()
		log.Println("⚠️ 未能提取 ut Token，使用默认值")
	}

	// === 提取所有 Cookie 注入 Go HTTP 客户端 ===
	browserCookies, err := page.Context().Cookies()
	if err != nil {
		return fmt.Errorf("获取 Cookie 失败: %w", err)
	}

	u, _ := url.Parse("https://push2his.eastmoney.com")
	goCookies := make([]*http.Cookie, 0, len(browserCookies))
	for _, ck := range browserCookies {
		cookie := &http.Cookie{
			Name:     ck.Name,
			Value:    ck.Value,
			Path:     ck.Path,
			Domain:   ck.Domain,
			Expires:  time.Unix(int64(ck.Expires), 0),
			Secure:   ck.Secure,
			HttpOnly: ck.HttpOnly,
		}
		goCookies = append(goCookies, cookie)
	}

	c.httpClient.Jar.SetCookies(u, goCookies)
	log.Printf("✅ 已同步 %d 个 Cookie 到 Go HTTP 客户端", len(goCookies))
	return nil
}

// ─── Go 高速请求 ─────────────────────────────────

// KLineResult K线返回数据
type KLineResult struct {
	Data struct {
		KLines []string `json:"klines"` // 每行: "日期,开盘,收盘,最高,最低,成交量,成交额,振幅,涨跌幅,涨跌额,换手率"
	} `json:"data"`
}

// FetchKLine 使用 Go HTTP 客户端获取 K 线数据（高性能、高并发）
func (c *EastMoneyCrawler) FetchKLine(secID string, klt, fqt int) (*KLineResult, error) {
	c.mu.RLock()
	ut := c.utToken
	c.mu.RUnlock()

	// 构造 JSONP 回调名（模仿 jQuery 风格）
	callback := fmt.Sprintf("jQuery_%d_%d", time.Now().UnixMilli(), time.Now().UnixNano())

	// 构造请求参数
	params := url.Values{}
	params.Set("cb", callback)
	params.Set("secid", secID) // 如 "1.603160"
	params.Set("ut", ut)
	params.Set("fields1", "f1,f2,f3,f4,f5,f6")
	params.Set("fields2", "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61")
	params.Set("klt", fmt.Sprintf("%d", klt)) // 101=日K, 102=周K, 103=月K
	params.Set("fqt", fmt.Sprintf("%d", fqt)) // 0=不复权, 1=前复权, 2=后复权
	params.Set("beg", "0")
	params.Set("end", "20500101")
	params.Set("smplmt", "460")
	params.Set("lmt", "1000000")
	params.Set("_", fmt.Sprintf("%d", time.Now().UnixMilli()))

	targetURL := "https://push2his.eastmoney.com/api/qt/stock/kline/get?" + params.Encode()

	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return nil, err
	}

	// ⚠️ 关键：Referer 必须带，东财检查这个
	req.Header.Set("Referer", "https://quote.eastmoney.com/")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "+
		"AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "*/*")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")
	req.Header.Set("Connection", "keep-alive")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// 解析 JSONP 响应 → 提取 JSON 部分
	// 返回格式: jQuery_callback_123({...json数据...})
	jsonStr := extractJSONFromJSONP(string(body))
	if jsonStr == "" {
		return nil, fmt.Errorf("JSONP 解析失败: %s", string(body)[:min(200, len(body))])
	}

	// 这里你可以用 encoding/json 反序列化，或者直接解析 klines 数组
	// 为了演示灵活，直接返回原始字符串，调用方自己解析
	log.Printf("✅ 获取到 K 线数据: %d bytes", len(jsonStr))
	return nil, nil // 返回 nil 占位，下面有完整解析版本
}

// ParseKLines 解析 K 线数据为结构体
func (c *EastMoneyCrawler) ParseKLines(secID string, klt, fqt int) ([][]string, error) {
	c.mu.RLock()
	ut := c.utToken
	c.mu.RUnlock()

	callback := fmt.Sprintf("jQuery_%d_%d", time.Now().UnixMilli(), time.Now().UnixNano())
	params := url.Values{}
	params.Set("cb", callback)
	params.Set("secid", secID)
	params.Set("ut", ut)
	params.Set("fields1", "f1,f2,f3,f4,f5,f6")
	params.Set("fields2", "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61")
	params.Set("klt", fmt.Sprintf("%d", klt))
	params.Set("fqt", fmt.Sprintf("%d", fqt))
	params.Set("beg", "0")
	params.Set("end", "20500101")
	params.Set("smplmt", "460")
	params.Set("lmt", "1000000")
	params.Set("_", fmt.Sprintf("%d", time.Now().UnixMilli()))

	targetURL := "https://push2his.eastmoney.com/api/qt/stock/kline/get?" + params.Encode()

	req, _ := http.NewRequest("GET", targetURL, nil)
	req.Header.Set("Referer", "https://quote.eastmoney.com/")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "*/*")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	// 从 JSONP 中提取 JSON
	jsonStr := extractJSONFromJSONP(string(body))
	if jsonStr == "" {
		return nil, fmt.Errorf("JSONP 解析失败")
	}

	// 用正则提取 klines 数组
	re := regexp.MustCompile(`"klines":\[([^\]]+)\]`)
	match := re.FindStringSubmatch(jsonStr)
	if len(match) < 2 {
		return nil, fmt.Errorf("未找到 klines 数据")
	}

	// 解析数组
	rawKLines := match[1]
	parts := splitCSVInBrackets(rawKLines)

	result := make([][]string, 0, len(parts))
	for _, line := range parts {
		// 格式: "2025-01-10,45.28,46.50,45.39,47.08,..."
		line = strings.Trim(line, "\"")
		fields := strings.Split(line, ",")
		result = append(result, fields)
	}

	return result, nil
}

// ─── 定时刷新 ───────────────────────────────────

// RefreshLoop 定时用浏览器刷新 Credentials
func (c *EastMoneyCrawler) RefreshLoop(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			log.Println("🔄 定时刷新 Credentials...")
			if err := c.InitCredentials(); err != nil {
				log.Printf("⚠️  刷新失败: %v", err)
			}
		}
	}
}

func (c *EastMoneyCrawler) Close() {
	_ = c.browser.Close()
	_ = c.pw.Stop()
}

// ─── 辅助函数 ───────────────────────────────────

// extractJSONFromJSONP 从 JSONP 包裹中提取纯 JSON
// 输入: jQuery_cb_123({...}) → 输出: {...}
func extractJSONFromJSONP(raw string) string {
	start := strings.Index(raw, "(")
	end := strings.LastIndex(raw, ")")
	if start == -1 || end == -1 || end <= start {
		return ""
	}
	return raw[start+1 : end]
}

// splitCSVInBrackets 解析数组格式的字符串，支持引号内的逗号
func splitCSVInBrackets(raw string) []string {
	var result []string
	depth := 0
	current := strings.Builder{}

	for _, ch := range raw {
		switch ch {
		case '[':
			depth++
			if depth > 1 {
				current.WriteRune(ch)
			}
		case ']':
			depth--
			if depth >= 1 {
				current.WriteRune(ch)
			} else if current.Len() > 0 {
				// 最外层结束，完成
			}
		case ',':
			if depth <= 1 {
				result = append(result, strings.TrimSpace(current.String()))
				current.Reset()
			} else {
				current.WriteRune(ch)
			}
		default:
			current.WriteRune(ch)
		}
	}
	if current.Len() > 0 {
		result = append(result, strings.TrimSpace(current.String()))
	}
	return result
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// ─── 使用示例 ───────────────────────────────────

func main() {
	crawler, err := NewEastMoneyCrawler()
	if err != nil {
		log.Fatal(err)
	}
	defer crawler.Close()

	// ===== 阶段 1：浏览器获取凭据 =====
	if err := crawler.InitCredentials(); err != nil {
		log.Fatal(err)
	}

	// ===== 阶段 2：Go 高速爬 K 线 =====
	// 并发取多只股票
	stocks := []string{
		"1.603160", // 汇顶科技
		"1.600519", // 贵州茅台
		"0.000001", // 平安银行
	}

	var wg sync.WaitGroup
	for _, stock := range stocks {
		wg.Add(1)
		go func(sid string) {
			defer wg.Done()

			data, err := crawler.ParseKLines(sid, 101, 1) // 日K、前复权
			if err != nil {
				log.Printf("❌ %s: %v", sid, err)
				return
			}

			// 打印最近 5 条
			log.Printf("📊 %s K线数据 (%d 条):", sid, len(data))
			start := len(data) - 5
			if start < 0 {
				start = 0
			}
			for _, row := range data[start:] {
				// 日期 开盘 收盘 最高 最低 成交量 成交额 振幅 涨跌幅 涨跌额 换手率
				fmt.Printf("  %s | 开:%-8s 收:%-8s 高:%-8s 低:%-8s | 量:%-10s 额:%-12s | 幅:%-6s%%\n",
					row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[8])
			}
		}(stock)
	}
	wg.Wait()

	// ===== 阶段 3：启动后台定时刷新 =====
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go crawler.RefreshLoop(ctx, 10*time.Minute)

	// 保持运行，定时刷 Cookie/Token
	time.Sleep(1 * time.Minute)
	log.Println("🏁 完成")
}
