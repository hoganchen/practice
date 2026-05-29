// ============================================================
// 知识点：http.ResponseController / CrossOriginProtection（Go 1.20+）
//
// http.ResponseController（Go 1.20）：
//   提供更精细的 HTTP 响应控制：
//   - Flush()：刷新缓冲区到客户端
//   - Hijack()：劫持连接（WebSocket/SSE 用）
//   - SetReadDeadline() / SetWriteDeadline()：读写超时
//
// http.CrossOriginProtection（Go 1.25）：
//   跨站请求伪造（CSRF）保护中间件。
//   使用方式：cop.Handler(handler) 包装处理器
//
// 编译运行方法：
//   go run 01_http_advanced.go
//
// 然后访问 http://localhost:8080/
// ============================================================

package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

func main() {
	mux := http.NewServeMux()

	// -------- 使用 ResponseController 控制响应 --------
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		rc := http.NewResponseController(w)
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")

		fmt.Fprintln(w, "=== ResponseController ===")
		for i := 1; i <= 3; i++ {
			fmt.Fprintf(w, "第 %d 行: %s\n", i, time.Now().Format(time.StampMilli))
			rc.Flush() // 立即推送
			time.Sleep(300 * time.Millisecond)
		}
		fmt.Fprintln(w, "完成!")
	})

	// -------- CrossOriginProtection CSRF 保护（Go 1.25）--------
	cop := http.NewCrossOriginProtection()

	// 添加受信源（实际部署时需配置）
	cop.AddTrustedOrigin("https://example.com")

	csrfHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		fmt.Fprintln(w, "此请求通过了 CSRF 检查")
		fmt.Fprintln(w, "Sec-Fetch-Site:", r.Header.Get("Sec-Fetch-Site"))
	})

	// 用 CrossOriginProtection 包装处理器
	mux.Handle("GET /csrf-demo", cop.Handler(csrfHandler))

	// -------- 服务器启动 --------
	addr := ":8080"
	fmt.Printf("HTTP 服务器启动于 http://localhost%s\n", addr)
	fmt.Println("  GET /           — ResponseController + Flush")
	fmt.Println("  GET /csrf-demo  — CSRF 保护中间件")
	log.Fatal(http.ListenAndServe(addr, mux))
}
