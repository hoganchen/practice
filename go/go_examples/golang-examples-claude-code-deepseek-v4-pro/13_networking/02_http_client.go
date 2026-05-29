// ============================================================
// 知识点：HTTP 客户端
//
// Go 的 net/http 包提供 HTTP 客户端功能。
// http.Get 用于简单 GET 请求。
// http.Client 用于高级配置（超时、传输设置等）。
// 始终使用 defer resp.Body.Close() 关闭响应体。
// ============================================================

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// ---- 响应数据结构 ----
type Task struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Completed bool      `json:"completed"`
	CreatedAt time.Time `json:"created_at"`
}

func main() {
	// ---- 1. 基本 GET 请求 ----
	fmt.Println("--- 基本 GET ---")

	// 使用公开 API 做演示
	resp, err := http.Get("https://httpbin.org/get")
	if err != nil {
		fmt.Println("请求失败:", err)
		return
	}
	defer resp.Body.Close() // 必须关闭！

	fmt.Printf("状态码: %d\n", resp.StatusCode)
	fmt.Printf("Content-Type: %s\n", resp.Header.Get("Content-Type"))

	// 读取响应体
	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("响应长度: %d 字节\n", len(body))
	displayLen := 200
	if len(body) < displayLen {
		displayLen = len(body)
	}
	fmt.Printf("响应(前200字节): %s\n", string(body[:displayLen]))

	// ---- 2. JSON 解析响应 ----
	fmt.Println("\n--- JSON 解析 ---")

	type HttpBinResp struct {
		Origin string `json:"origin"`
		URL    string `json:"url"`
		Headers map[string]string `json:"headers"`
	}

	resp2, _ := http.Get("https://httpbin.org/get")
	defer resp2.Body.Close()

	var data HttpBinResp
	json.NewDecoder(resp2.Body).Decode(&data)
	fmt.Printf("来源 IP: %s\n", data.Origin)
	fmt.Printf("请求 URL: %s\n", data.URL)
	fmt.Printf("User-Agent: %s\n", data.Headers["User-Agent"])

	// ---- 3. POST 请求 ----
	fmt.Println("\n--- POST 请求 ---")

	// JSON 请求体
	requestBody := map[string]interface{}{
		"name":  "Alice",
		"email": "alice@example.com",
	}
	jsonBody, _ := json.Marshal(requestBody)

	resp3, err := http.Post(
		"https://httpbin.org/post",
		"application/json",
		bytes.NewReader(jsonBody),
	)
	if err != nil {
		fmt.Println("POST 失败:", err)
		return
	}
	defer resp3.Body.Close()

	var postResult map[string]interface{}
	json.NewDecoder(resp3.Body).Decode(&postResult)
	jsonData, _ := postResult["json"].(map[string]interface{})
	fmt.Printf("POST 回显: name=%s, email=%s\n",
		jsonData["name"], jsonData["email"])

	// ---- 4. 带超时的 Client ----
	fmt.Println("\n--- 带超时的 Client ---")

	timeoutClient := &http.Client{
		Timeout: 5 * time.Second,
	}

	resp4, err := timeoutClient.Get("https://httpbin.org/delay/1")
	if err != nil {
		fmt.Println("超时/错误:", err)
	} else {
		defer resp4.Body.Close()
		fmt.Printf("带超时请求成功: %d\n", resp4.StatusCode)
	}

	// ---- 5. 自定义请求头 ----
	fmt.Println("\n--- 自定义请求 ---")

	req, _ := http.NewRequest("GET", "https://httpbin.org/headers", nil)
	req.Header.Set("Authorization", "Bearer my-token")
	req.Header.Set("X-Custom-Header", "custom-value")
	req.Header.Set("Accept", "application/json")

	resp5, _ := http.DefaultClient.Do(req)
	defer resp5.Body.Close()

	var headersResp map[string]interface{}
	json.NewDecoder(resp5.Body).Decode(&headersResp)
	fmt.Printf("自定义请求头: %+v\n", headersResp)

	// ---- 6. 下载内容并保存 ----
	fmt.Println("\n--- 下载内容 ---")

	// 实际使用中：
	// resp, err := http.Get(url)
	// body, err := io.ReadAll(resp.Body)
	// os.WriteFile("output.txt", body, 0644)
	fmt.Println("  下载文件的模式：io.ReadAll + os.WriteFile")

	// ---- 7. 请求/响应状态检查 ----
	fmt.Println("\n--- 状态码检查 ---")

	statusCheck := func(url string) {
		resp, err := http.Get(url)
		if err != nil {
			fmt.Printf("  %s: 错误=%v\n", url, err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			fmt.Printf("  %s: 成功 (%d)\n", url, resp.StatusCode)
		} else if resp.StatusCode >= 400 && resp.StatusCode < 500 {
			fmt.Printf("  %s: 客户端错误 (%d)\n", url, resp.StatusCode)
		} else if resp.StatusCode >= 500 {
			fmt.Printf("  %s: 服务端错误 (%d)\n", url, resp.StatusCode)
		}
	}

	statusCheck("https://httpbin.org/status/200")
	statusCheck("https://httpbin.org/status/404")
	statusCheck("https://httpbin.org/status/500")

	// ---- 8. 并发请求 ----
	fmt.Println("\n--- 并发请求 ---")

	urls := []string{
		"https://httpbin.org/get",
		"https://httpbin.org/headers",
		"https://httpbin.org/ip",
	}

	results := make(chan string, len(urls))
	for _, url := range urls {
		go func(u string) {
			resp, err := http.Get(u)
			if err != nil {
				results <- fmt.Sprintf("%s: 错误", u)
				return
			}
			defer resp.Body.Close()
			results <- fmt.Sprintf("%s: %d", u, resp.StatusCode)
		}(url)
	}

	for range urls {
		fmt.Println("  ", <-results)
	}
}

// 编译运行：go run 02_http_client.go
// 注意：需要网络连接
