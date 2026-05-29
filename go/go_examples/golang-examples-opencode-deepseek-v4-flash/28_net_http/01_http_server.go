// ============================================================
// 知识点：HTTP 服务与增强路由（Go 1.22+ 路由增强）
//
// Go 1.22 增强了 net/http 标准库的路由功能：
//   1. 支持路由模式中的 HTTP 方法前缀（"GET /path"）
//   2. 支持路径参数（{name}）
//   3. 支持通配符（{name...}）
//   4. 请求路径中的参数可通过 PathValue 获取
//
// 编译运行方法：
//   go run 01_http_server.go
//
// 然后在浏览器中访问：
//   http://localhost:8080/
//   http://localhost:8080/api/users/张三
//   http://localhost:8080/api/items/42
// ============================================================

package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	// -------- 创建 ServeMux（Go 1.22 路由增强）--------
	mux := http.NewServeMux()

	// -------- 路由1：基本路径 --------
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "欢迎来到 Go HTTP 服务器！")
		fmt.Fprintln(w, "可用路由:")
		fmt.Fprintln(w, "  GET /")
		fmt.Fprintln(w, "  GET /hello/{name}")
		fmt.Fprintln(w, "  GET /api/users/{id}")
		fmt.Fprintln(w, "  POST /api/data")
	})

	// -------- 路由2：路径参数 {name} --------
	mux.HandleFunc("GET /hello/{name}", func(w http.ResponseWriter, r *http.Request) {
		name := r.PathValue("name") // 获取路径参数
		fmt.Fprintf(w, "你好，%s！\n", name)
	})

	// -------- 路由3：精确匹配 + 路径参数 --------
	mux.HandleFunc("GET /api/users/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		fmt.Fprintf(w, "查询用户: %s\n", id)
	})

	// -------- 路由4：POST 请求 --------
	mux.HandleFunc("POST /api/data", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "收到 POST 请求")
	})

	// -------- 路由5：通配符后缀 {pathname...} --------
	mux.HandleFunc("GET /static/{path...}", func(w http.ResponseWriter, r *http.Request) {
		path := r.PathValue("path")
		fmt.Fprintf(w, "静态文件路径: %s\n", path)
	})

	// -------- 启动服务器 --------
	addr := ":8080"
	fmt.Printf("服务器启动于 http://localhost%s\n", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
