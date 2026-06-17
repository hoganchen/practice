// ============================================================================
// 知识点: 增强型 HTTP 路由 (Go 1.22+)
//
// 说明:
// - Go 1.22+ net/http.ServeMux 支持方法匹配和路径参数
// - 语法: "GET /api/users/{id}" 表示匹配 GET 方法和路径
// - r.PathValue("id") 获取路径参数
// - 支持通配符 {name} 和剩余路径匹配 {name...}
// - 不再需要第三方路由库处理简单场景
//
// 编译和运行:
//   go run 16_networking\05_http_enhanced_router.go
//   访问: http://localhost:8081/
//   访问: http://localhost:8081/api/users/42
//   访问: http://localhost:8081/api/posts/golang/hello
// ============================================================================

package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	// 方法 + 路径匹配
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "欢迎来到 Go 1.22+ 路由演示!\n")
	})

	// 路径参数 {id}
	mux.HandleFunc("GET /api/users/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		fmt.Fprintf(w, "用户信息: ID = %s\n", id)
	})

	// 剩余路径匹配 {...}
	mux.HandleFunc("GET /api/posts/{category}/{slug...}", func(w http.ResponseWriter, r *http.Request) {
		category := r.PathValue("category")
		slug := r.PathValue("slug")
		fmt.Fprintf(w, "文章: category=%s, slug=%s\n", category, slug)
	})

	// POST 方法
	mux.HandleFunc("POST /api/users", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "创建用户 (POST 请求)\n")
	})

	fmt.Println("HTTP 服务器启动在 :8081")
	log.Fatal(http.ListenAndServe(":8081", mux))
}
