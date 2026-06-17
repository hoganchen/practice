// ============================================================================
// 知识点: HTTP 客户端
//
// 说明:
// - http.Get 发送 GET 请求
// - http.Client 提供更高级的客户端配置(超时、传输等)
// - http.NewRequest 创建自定义请求(设置 Headers 等)
// - resp.Body 需要在使用后关闭
// - io.ReadAll 读取响应体
//
// 编译和运行:
//   go run 16_networking\04_http_client.go
//   建议先启动 HTTP 服务器: go run 16_networking\03_http_server.go
// ============================================================================

package main

import (
	"fmt"
	"io"
	"net/http"
	"time"
)

func main() {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	url := "http://127.0.0.1:8080/api/hello/Go%E8%AF%AD%E8%A8%80"
	fmt.Println("请求 URL:", url)

	resp, err := client.Get(url)
	if err != nil {
		fmt.Println("请求失败:", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("读取响应失败:", err)
		return
	}

	fmt.Printf("状态码: %d\n", resp.StatusCode)
	fmt.Printf("响应体: %s\n", string(body))
}
