// ============================================================================
// 知识点: net/url URL 解析与构建
//
// 说明:
// - url.Parse 解析 URL 字符串为 URL 结构体
// - URL 结构体包含 Scheme, Host, Path, Query 等字段
// - url.Values 用于构建和操作查询参数
// - url.QueryEscape / PathEscape 对特殊字符编码
// - url.URL 可以直接构造完整的 URL
//
// 编译和运行:
//   go run 40_net_url\01_url_parsing.go
// ============================================================================

package main

import (
	"fmt"
	"net/url"
)

func main() {
	// 解析 URL
	rawURL := "https://user:pass@api.example.com:8080/search?q=golang&page=1&lang=zh#results"
	parsed, err := url.Parse(rawURL)
	if err != nil {
		fmt.Println("解析失败:", err)
		return
	}

	fmt.Println("URL 解析结果:")
	fmt.Printf("  Scheme: %s\n", parsed.Scheme)
	fmt.Printf("  User: %s\n", parsed.User)
	fmt.Printf("  Host: %s\n", parsed.Host)
	fmt.Printf("  Hostname: %s\n", parsed.Hostname())
	fmt.Printf("  Port: %s\n", parsed.Port())
	fmt.Printf("  Path: %s\n", parsed.Path)
	fmt.Printf("  Fragment: %s\n", parsed.Fragment)

	// 查询参数
	query := parsed.Query()
	fmt.Println("\n查询参数:")
	fmt.Printf("  q: %s\n", query.Get("q"))
	fmt.Printf("  page: %s\n", query.Get("page"))
	fmt.Printf("  lang: %s\n", query.Get("lang"))

	// 构建查询参数
	params := url.Values{}
	params.Set("q", "go语言")
	params.Set("page", "1")
	params.Add("tag", "tutorial")
	params.Add("tag", "example")
	fmt.Println("\n构建的查询字符串:", params.Encode())

	// 编码特殊字符
	encoded := url.QueryEscape("Go 语言 & 代码!")
	fmt.Println("QueryEscape:", encoded)
	decoded, _ := url.QueryUnescape(encoded)
	fmt.Println("  Unescape:", decoded)

	// 直接构建 URL
	built := &url.URL{
		Scheme:   "https",
		Host:     "godoc.org",
		Path:     "/pkg/net/url",
		RawQuery: "q=Parse",
	}
	fmt.Println("\n构建的 URL:", built.String())
}
