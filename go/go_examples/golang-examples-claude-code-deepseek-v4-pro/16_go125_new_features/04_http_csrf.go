// ============================================================
// 知识点：net/http.CrossOriginProtection — 内置 CSRF 防护（Go 1.25）
//
// Go 1.25 新增的 CSRF 防护中间件，基于浏览器 Fetch 元数据
// 头（Sec-Fetch-Site）无需 token 或 cookie。
//
// 核心 API:
//   type CrossOriginProtection struct { ... }
//   func NewCrossOriginProtection() *CrossOriginProtection
//   func (c *CrossOriginProtection) Handler(h http.Handler) http.Handler
//   func (c *CrossOriginProtection) AddTrustedOrigin(origin string) error
//   func (c *CrossOriginProtection) AddInsecureBypassPattern(pattern string)
//   func (c *CrossOriginProtection) SetDenyHandler(h http.Handler)
//   func (c *CrossOriginProtection) Check(req *http.Request) error
//
// 原理：浏览器在发送跨域请求时附带 Sec-Fetch-Site 头，
// 服务端据此判断请求是否来自同一站点。
// ============================================================

package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

func main() {
	// ---- 1. 创建 CrossOriginProtection 实例 ----
	fmt.Println("=== http.CrossOriginProtection (Go 1.25+) ===")
	fmt.Println("CSRF 保护中间件示例")
	fmt.Println()

	// 创建 CSRF 保护中间件
	cop := http.NewCrossOriginProtection()

	// 添加受信任的外部来源（如前端域名）
	_ = cop.AddTrustedOrigin("https://myapp.example.com")
	fmt.Println("添加信任来源: https://myapp.example.com")

	// 某些端点绕过 CSRF 检查（例如健康检查、webhook）
	cop.AddInsecureBypassPattern("/healthz")
	fmt.Println("绕过路径: /healthz")

	// 自定义拒绝处理（CSRF 检查失败时调用）
	cop.SetDenyHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		fmt.Fprintf(w, `{"error":"cross-origin request blocked","code":"csrf_blocked"}`)
	}))
	fmt.Println("已设置自定义拒绝处理器")

	// ---- 2. 创建应用路由 ----
	mux := http.NewServeMux()

	// 公开端点
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, `{"status":"ok","time":"%s"}`, time.Now().Format(time.RFC3339))
	})

	// 需要 CSRF 保护的端点
	mux.HandleFunc("POST /api/transfer", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"transfer initiated","amount":100}`)
	})

	mux.HandleFunc("POST /api/update-profile", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"profile updated"}`)
	})

	// 带 Sec-Fetch-Site 头的测试端点
	mux.HandleFunc("GET /demo", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprintf(w, `<h1>CSRF 保护演示</h1>
<p>Go 1.25 内置的 CrossOriginProtection 中间件会检查：</p>
<ul>
  <li><strong>Sec-Fetch-Site</strong> 头（浏览器自动发送）</li>
  <li><strong>Origin</strong> 头（降级方案）</li>
</ul>
<form action="/api/transfer" method="POST">
  <button type="submit">测试转账（同域请求）</button>
</form>
`)
	})

	// ---- 3. 包装并启动服务 ----
	// 使用 CrossOriginProtection 保护所有路由
	handler := cop.Handler(mux)

	port := ":8081"
	fmt.Println()
	fmt.Printf("服务器运行在 http://localhost%s\n", port)
	fmt.Println()
	fmt.Println("测试方法：")
	fmt.Println("  1. 同域 POST：")
	fmt.Printf("     curl -X POST http://localhost%s/api/transfer\n", port)
	fmt.Println("     → 200（同域，允许）")
	fmt.Println()
	fmt.Println("  2. 跨域 POST（无 Sec-Fetch-Site）：")
	fmt.Printf("     curl -X POST http://localhost%s/api/transfer \\\n", port)
	fmt.Println("       -H \"Origin: https://evil.com\"")
	fmt.Println("     → 403（跨域，被阻止）")
	fmt.Println()
	fmt.Println("  3. 健康检查（绕过 CSRF 检查）：")
	fmt.Printf("     curl http://localhost%s/healthz\n", port)
	fmt.Println("     → 200（绕过路径）")
	fmt.Println()
	fmt.Println("  4. 访问演示页面：")
	fmt.Printf("     http://localhost%s/demo\n", port)
	fmt.Println()
	fmt.Println("按 Ctrl+C 停止服务器")

	// 启动 HTTP 服务
	if err := http.ListenAndServe(port, handler); err != nil {
		log.Fatal("服务器启动失败:", err)
	}
}

// ---- 编译与运行 ----
// go run 04_http_csrf.go
// 需要 Go 1.25+
//
// 注意事项：
// - CrossOriginProtection 仅保护不安全方法（POST/PUT/DELETE 等）
// - GET/HEAD/OPTIONS 等安全方法不受影响
// - Sec-Fetch-Site 头由浏览器自动添加（curl 不会自动添加）
// - 测试跨域时，可以使用 curl -H 手动设置 Origin 头
