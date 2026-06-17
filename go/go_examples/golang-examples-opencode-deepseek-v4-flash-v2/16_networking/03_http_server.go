// ============================================================================
// 知识点: HTTP 服务器
//
// 说明:
// - net/http 包提供了完整的 HTTP 客户端和服务器实现
// - http.HandleFunc 注册路由处理函数
// - http.ListenAndServe 启动 HTTP 服务器
// - 处理函数接收 http.ResponseWriter 和 *http.Request
// - 支持中间件模式 (通过包装 Handler)
//
// 编译和运行:
//   go run 16_networking\03_http_server.go
//   访问 http://localhost:8080
//   访问 http://localhost:8080/api/hello/World
// ============================================================================

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type Message struct {
	Text string `json:"text"`
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprintf(w, "你好, Go HTTP 服务器!\n请求路径: %s\n方法: %s", r.URL.Path, r.Method)
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	if name == "" {
		name = "未知"
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(Message{Text: fmt.Sprintf("你好, %s!", name)})
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /", helloHandler)
	mux.HandleFunc("GET /api/hello/{name}", apiHandler)

	fmt.Println("HTTP 服务器启动在 :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
