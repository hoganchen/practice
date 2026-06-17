// ============================================================================
// 知识点: HTTP 中间件模式
//
// 说明:
// - 中间件是包装 http.Handler 的函数, 用于横切关注点
// - 常见中间件: 日志、认证、限流、恢复、CORS
// - 中间件链: handler = middleware1(middleware2(finalHandler))
// - 每个中间件接收 http.Handler, 返回新的 http.Handler
// - 这种函数式组合是 Go HTTP 生态的核心模式
//
// 编译和运行:
//   go run 45_http_advanced\01_http_middleware.go
//   访问: http://localhost:8082/
// ============================================================================

package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

// 中间件类型
type Middleware func(http.Handler) http.Handler

// 日志中间件
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		fmt.Printf("[%s] %s %s\n", r.Method, r.URL.Path, r.RemoteAddr)
		next.ServeHTTP(w, r)
		fmt.Printf("[%s] %s 耗时: %v\n", r.Method, r.URL.Path, time.Since(start))
	})
}

// 恢复中间件 (防止 panic 导致进程崩溃)
func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				fmt.Printf("[PANIC] %v\n", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// 中间件链
func Chain(handler http.Handler, middlewares ...Middleware) http.Handler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Hello, Middleware!")
}

func panicHandler(w http.ResponseWriter, r *http.Request) {
	panic("模拟 panic")
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /", helloHandler)
	mux.HandleFunc("GET /panic", panicHandler)

	handler := Chain(mux, LoggingMiddleware, RecoveryMiddleware)

	fmt.Println("HTTP 中间件示例启动在 :8082")
	log.Fatal(http.ListenAndServe(":8082", handler))
}
