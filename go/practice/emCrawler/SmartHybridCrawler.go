package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
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
// SmartHybridCrawler — 智能降级杂交爬虫
//
// 模式等级：
//   ModeGoOnly     = 纯 Go（最快，0 浏览器开销）
//   ModeHybrid     = 浏览器辅助拿 Credentials
//   ModeBrowser    = 全浏览器模式（请求也走浏览器）
// ──────────────────────────────────────────────

type CrawlMode int

const (
	ModeGoOnly  CrawlMode = iota // 纯 Go，最快
	ModeHybrid                   // Go 请求 + 浏览器取凭据
	ModeBrowser                  // 全浏览器（最终降级）
)

func (m CrawlMode) String() string {
	switch m {
	case ModeGoOnly:
		return "纯Go"
	case ModeHybrid:
		return "Go+浏览器"
	case ModeBrowser:
		return "全浏览器"
	default:
		return "未知"
	}
}

// ─── K 线数据结构 ───────────────────────────────

type KLineRecord struct {
	Date         string  // 日期
	Open         float64 // 开盘
	Close        float64 // 收盘
	High         float64 // 最高
	Low          float64 // 最低
	Volume       int64   // 成交量
	Amount       float64 // 成交额
	Amplitude    float64 // 振幅
	ChangePct    float64 // 涨跌幅
	ChangeAmt    float64 // 涨跌额
	TurnoverRate float64 // 换手率
}

type KLineResponse struct {
	RC     int         `json:"rc"`
	Data   *KLineData  `json:"data"`
}

type KLineData struct {
	KLines []string `json:"klines"`
}

// ─── 降级爬虫 ───────────────────────────────────

type SmartHybridCrawler struct {
	mode        CrawlMode
	baseHeaders map[string]string

	// Go HTTP 客户端（核心）
	httpClient *http.Client

	// 浏览器相关（延迟初始化）
	pw      *playwright.Playwright
	browser playwright.Browser
	pwOnce  sync.Once
	pwReady bool

	// Credentials
	utTokens []string
	mu       sync.RWMutex

	// 统计
	goRequests   int64
	banCount     int64
	browserCount int64
}

func NewSmartHybridCrawler() *SmartHybridCrawler {
	jar, _ := cookiejar.New(&cookiejar.Options{
		PublicSuffixList: publicsuffix.List,
	})

	return &SmartHybridCrawler{
		mode: ModeGoOnly, // 初始：纯 Go
		baseHeaders: map[string]string{
			"Referer":       "https://quote.eastmoney.com/",
			"User-Agent":    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
			"Accept":        "*/*",
			"Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
		},
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
			Jar:     jar,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 20,
				IdleConnTimeout:     90 * time.Second,
				DisableCompression:  false,
			},
		},
		// 预置一批已知 ut Token（轮换用）
		utTokens: []string{
			"fa5fd1943c7b386f172d6893dbfba10b",
			"7eec6a7f3e5b4c8d9a0b1c2d3e4f5a6b",
			"3d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
			"b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6",
		},
	}
}

// ─── 浏览器延迟初始化 ───────────────────────────

func (c *SmartHybridCrawler) ensureBrowser() error {
	var initErr error
	c.pwOnce.Do(func() {
		log.Println("🚀 首次初始化浏览器（延迟加载）...")
		pw, err := playwright.Run()
		if err != nil {
			initErr = fmt.Errorf("启动 Playwright 失败: %w", err)
			return
		}
		browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
			Headless: playwright.Bool(true),
			Args: []string{
				"--disable-blink-features=AutomationControlled",
				"--no-sandbox",
			},
		})
		if err != nil {
			initErr = fmt.Errorf("启动 Chromium 失败: %w", err)
			return
		}
		c.pw = pw
		c.browser = browser
		c.pwReady = true
		log.Println("✅ 浏览器就绪")
	})
	return initErr
}

func (c *SmartHybridCrawler) Close() {
	if c.pwReady {
		_ = c.browser.Close()
		_ = c.pw.Stop()
	}
}

// ─── 凭据管理 ───────────────────────────────────

// refreshUTToken 纯 Go：从首页 HTML 提取 ut Token
func (c *SmartHybridCrawler) refreshUTTokenGo() (string, error) {
	req, _ := http.NewRequest("GET", "https://quote.eastmoney.com/", nil)
	for k, v := range c.baseHeaders {
		req.Header.Set(k, v)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	// 从 script 或 HTML 中找 ut
	re := regexp.MustCompile(`ut["']?\s*[:=]\s*["']([^"']+)["']`)
	match := re.FindSubmatch(body)
	if len(match) >= 2 {
		return string(match[1]), nil
	}

	return "", fmt.Errorf("首页未找到 ut Token")
}

// refreshCredentialsBrowser 浏览器模式：拿 Cookie + Token
func (c *SmartHybridCrawler) refreshCredentialsBrowser() error {
	if err := c.ensureBrowser(); err != nil {
		return err
	}

	page, err := c.browser.NewPage()
	if err != nil {
		return err
	}
	defer page.Close()

	if _, err := page.Goto("https://quote.eastmoney.com/", playwright.PageGotoOptions{
		WaitUntil: playwright.WaitUntilStateNetworkidle,
		Timeout:   playwright.Float(30000),
	}); err != nil {
		return err
	}
	time.Sleep(2 * time.Second)

	// 提取 ut Token
	token, err := page.Evaluate(`() => {
		if (window.ut) return window.ut;
		try {
			let scripts = document.querySelectorAll('script');
			for (let s of scripts) {
				let m = s.textContent.match(/["']ut["']\s*[:=]\s*["']([^"']+)["']/);
				if (m) return m[1];
			}
		} catch(e) {}
		return null;
	}()`)
	if err == nil && token != nil && token != "" {
		c.mu.Lock()
		// 新 token 放最前面优先用
		c.utTokens = append([]string{fmt.Sprintf("%v", token)}, c.utTokens...)
		if len(c.utTokens) > 10 {
			c.utTokens = c.utTokens[:10]
		}
		c.mu.Unlock()
		log.Printf("🔑 浏览器提取新 Token: %s", token)
	}

	// 同步 Cookie
	browserCookies, _ := page.Context().Cookies()
	u, _ := url.Parse("https://push2his.eastmoney.com")
	goCookies := make([]*http.Cookie, 0, len(browserCookies))
	for _, ck := range browserCookies {
		goCookies = append(goCookies, &http.Cookie{
			Name: ck.Name, Value: ck.Value, Path: ck.Path,
			Domain: ck.Domain,
		})
	}
	c.httpClient.Jar.SetCookies(u, goCookies)
	log.Printf("🍪 同步 %d 个 Cookie", len(goCookies))

	return nil
}

// ─── 核心请求方法 ───────────────────────────────

func (c *SmartHybridCrawler) getUT() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if len(c.utTokens) == 0 {
		return "fa5fd1943c7b386f172d6893dbfba10b"
	}
	return c.utTokens[rand.Intn(len(c.utTokens))]
}

// isBanned 判断返回是否被 Ban
func isBanned(body []byte) bool {
	var resp KLineResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return false
	}
	// rc=-1 表示失败，或 data==null 表示被封
	return resp.RC != 0 || resp.Data == nil
}

// FetchKLines 自动降级获取 K 线数据
func (c *SmartHybridCrawler) FetchKLines(secID string, klt, fqt int) ([]KLineRecord, error) {
	// ===== 尝试 1：纯 Go 模式 =====
	records, err := c.fetchGo(secID, klt, fqt)
	if err == nil && len(records) > 0 {
		return records, nil
	}

	// 被 Ban 了 → 降级
	if err != nil && isBannedError(err) {
		c.banCount++
		log.Printf("⚠️  被 Ban 了（累计 %d 次），降级到 Hybrid 模式", c.banCount)

		if c.mode == ModeGoOnly {
			c.mode = ModeHybrid
		}

		// 尝试用浏览器刷新凭据
		if c.mode == ModeHybrid {
			if refreshErr := c.refreshCredentialsBrowser(); refreshErr != nil {
				log.Printf("❌ 浏览器刷新失败: %v，降级到全浏览器模式", refreshErr)
				c.mode = ModeBrowser
			} else {
				// 刷新成功，再试一次 Go 请求
				return c.fetchGo(secID, klt, fqt)
			}
		}
	}

	// ===== 尝试 2：全浏览器模式（最终降级） =====
	if c.mode == ModeBrowser {
		return c.fetchByBrowser(secID, klt, fqt)
	}

	return nil, fmt.Errorf("所有模式均失败: %w", err)
}

// ─── Go HTTP 请求 ───────────────────────────────

func (c *SmartHybridCrawler) fetchGo(secID string, klt, fqt int) ([]KLineRecord, error) {
	c.goRequests++

	// 构造 URL
	params := url.Values{}
	params.Set("cb", fmt.Sprintf("jQuery_%d_%d", time.Now().UnixMilli(), rand.Int63()))
	params.Set("secid", secID)
	params.Set("ut", c.getUT())
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
	for k, v := range c.baseHeaders {
		req.Header.Set(k, v)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	// 检查是否被 Ban
	if isBanned(body) {
		return nil, &BannedError{body: body, secID: secID}
	}

	// 解析 JSONP → JSON
	jsonStr := extractJSONFromJSONP(string(body))
	if jsonStr == "" {
		return nil, fmt.Errorf("JSONP 解析失败")
	}

	var kResp KLineResponse
	if err := json.Unmarshal([]byte(jsonStr), &kResp); err != nil {
		return nil, fmt.Errorf("JSON 解析失败: %w", err)
	}

	if kResp.Data == nil || len(kResp.Data.KLines) == 0 {
		return nil, fmt.Errorf("无数据")
	}

	// 解析 K 线行
	records := make([]KLineRecord, 0, len(kResp.Data.KLines))
	for _, line := range kResp.Data.KLines {
		rec, err := parseKLine(line)
		if err != nil {
			continue
		}
		records = append(records, rec)
	}

	return records, nil
}

// ─── 全浏览器请求（最终降级）─────────────────────

func (c *SmartHybridCrawler) fetchByBrowser(secID string, klt, fqt int) ([]KLineRecord, error) {
	c.browserCount++

	if err := c.ensureBrowser(); err != nil {
		return nil, err
	}

	page, err := c.browser.NewPage()
	if err != nil {
		return nil, err
	}
	defer page.Close()

	// 浏览器直接访问 API（绕过 JS Challenge）
	params := url.Values{}
	params.Set("secid", secID)
	params.Set("ut", c.getUT())
	params.Set("fields1", "f1,f2,f3,f4,f5,f6")
	params.Set("fields2", "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61")
	params.Set("klt", fmt.Sprintf("%d", klt))
	params.Set("fqt", fmt.Sprintf("%d", fqt))
	params.Set("beg", "0")
	params.Set("end", "20500101")
	params.Set("smplmt", "460")
	params.Set("lmt", "1000000")
	params.Set("_", fmt.Sprintf("%d", time.Now().UnixMilli()))

	apiURL := "https://push2his.eastmoney.com/api/qt/stock/kline/get?" + params.Encode()

	// 用浏览器发 xhr
	result, err := page.Evaluate(fmt.Sprintf(`async () => {
		let resp = await fetch(%q);
		let text = await resp.text();
		return text;
	}`, apiURL))
	if err != nil {
		return nil, fmt.Errorf("浏览器请求失败: %w", err)
	}

	resultStr, ok := result.(string)
	if !ok {
		return nil, fmt.Errorf("浏览器返回非字符串")
	}

	jsonStr := extractJSONFromJSONP(resultStr)
	if jsonStr == "" {
		return nil, fmt.Errorf("JSONP 解析失败")
	}

	var kResp KLineResponse
	if err := json.Unmarshal([]byte(jsonStr), &kResp); err != nil {
		return nil, err
	}

	if kResp.Data == nil {
		return nil, fmt.Errorf("浏览器请求也无数据（可能 API 彻底失效）")
	}

	records := make([]KLineRecord, 0, len(kResp.Data.KLines))
	for _, line := range kResp.Data.KLines {
		rec, err := parseKLine(line)
		if err != nil {
			continue
		}
		records = append(records, rec)
	}

	return records, nil
}

// ─── 后台刷新 ───────────────────────────────────

func (c *SmartHybridCrawler) StartBackgroundRefresh(ctx context.Context) {
	// 每 5 分钟尝试刷新 Token
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	// 先试一次纯 Go 刷新
	go func() {
		token, err := c.refreshUTTokenGo()
		if err == nil && token != "" {
			c.mu.Lock()
			c.utTokens = append([]string{token}, c.utTokens...)
			if len(c.utTokens) > 10 {
				c.utTokens = c.utTokens[:10]
			}
			c.mu.Unlock()
			log.Printf("🔄 后台刷新 Token 成功: %s", token[:10]+"...")
		}
	}()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// 优先纯 Go
			token, err := c.refreshUTTokenGo()
			if err == nil {
				c.mu.Lock()
				c.utTokens = append([]string{token}, c.utTokens...)
				if len(c.utTokens) > 10 {
					c.utTokens = c.utTokens[:10]
				}
				c.mu.Unlock()
				log.Println("🔄 后台刷新 Token 成功（纯Go）")
				continue
			}

			// 如果降级到了 Hybrid 或 Browser 模式，用浏览器刷新
			if c.mode != ModeGoOnly {
				if err := c.refreshCredentialsBrowser(); err != nil {
					log.Printf("⚠️  后台浏览器刷新失败: %v", err)
				}
			}
		}
	}
}

// ─── 辅助 ───────────────────────────────────────

type BannedError struct {
	body  []byte
	secID string
}

func (e *BannedError) Error() string {
	return fmt.Sprintf("被 Ban [%s]: %s", e.secID, string(e.body[:min(len(e.body), 200)]))
}

func isBannedError(err error) bool {
	if err == nil {
		return false
	}
	_, ok := err.(*BannedError)
	return ok
}

func extractJSONFromJSONP(raw string) string {
	start := strings.Index(raw, "(")
	end := strings.LastIndex(raw, ")")
	if start == -1 || end == -1 || end <= start {
		return ""
	}
	return raw[start+1 : end]
}

func parseKLine(line string) (KLineRecord, error) {
	fields := strings.Split(line, ",")
	if len(fields) < 11 {
		return KLineRecord{}, fmt.Errorf("字段不足: %d", len(fields))
	}

	record := KLineRecord{
		Date:  fields[0],
	}
	fmt.Sscanf(fields[1], "%f", &record.Open)
	fmt.Sscanf(fields[2], "%f", &record.Close)
	fmt.Sscanf(fields[3], "%f", &record.High)
	fmt.Sscanf(fields[4], "%f", &record.Low)
	fmt.Sscanf(fields[5], "%d", &record.Volume)
	fmt.Sscanf(fields[6], "%f", &record.Amount)
	fmt.Sscanf(fields[7], "%f", &record.Amplitude)
	fmt.Sscanf(fields[8], "%f", &record.ChangePct)
	fmt.Sscanf(fields[9], "%f", &record.ChangeAmt)
	fmt.Sscanf(fields[10], "%f", &record.TurnoverRate)

	return record, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// ─── 使用示例 ───────────────────────────────────

func main() {
	crawler := NewSmartHybridCrawler()
	defer crawler.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 启动后台刷新（5 分钟自动轮换 Token）
	go crawler.StartBackgroundRefresh(ctx)

	// ===== 并发获取多只股票 K 线 =====
	stocks := []struct {
		id  string
		name string
	}{
		{"1.603160", "汇顶科技"},
		{"1.600519", "贵州茅台"},
		{"0.000001", "平安银行"},
		{"1.688981", "中芯国际"},
	}

	// 多只股票并发，每只之间间隔控制
	limiter := make(chan struct{}, 2) // 最多 2 个并发
	var wg sync.WaitGroup

	for _, stock := range stocks {
		wg.Add(1)
		go func(sid, name string) {
			defer wg.Done()

			limiter <- struct{}{}        // 获取信号量
			defer func() { <-limiter }() // 释放

			// 智能降级获取（Go优先→被Ban降级）
			records, err := crawler.FetchKLines(sid, 101, 1)
			if err != nil {
				log.Printf("❌ %s (%s) 失败: %v", name, sid, err)
				return
			}

			// 打印最近 5 条
			log.Printf("📊 %s (%s): %d 条 K 线", name, sid, len(records))
			start := len(records) - 5
			if start < 0 {
				start = 0
			}
			for _, r := range records[start:] {
				fmt.Printf("  %s → 开:%.2f 收:%.2f 高:%.2f 低:%.2f 涨跌:%.2f%% 量:%d\n",
					r.Date, r.Open, r.Close, r.High, r.Low, r.ChangePct, r.Volume)
			}
		}(stock.id, stock.name)

		// 请求间隔 500ms，避免触发频率限制
		time.Sleep(500 * time.Millisecond)
	}

	wg.Wait()

	// 输出统计
	log.Printf("📈 统计: Go请求=%d  Ban=%d  浏览器降级=%d  当前模式=%s",
		crawler.goRequests, crawler.banCount, crawler.browserCount, crawler.mode)
}
