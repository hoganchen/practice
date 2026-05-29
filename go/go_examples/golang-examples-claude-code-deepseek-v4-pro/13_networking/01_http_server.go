// ============================================================
// 知识点：HTTP 服务器（net/http 包）
//
// Go 标准库的 net/http 包提供了完整的 HTTP 服务器和客户端。
// 使用 http.HandleFunc 注册路由，http.ListenAndServe 启动服务。
// Go 1.22+ 支持增强的路由模式（方法匹配、路径参数）。
// ============================================================

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// ---- 模拟数据 ----
type Task struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Completed bool      `json:"completed"`
	CreatedAt time.Time `json:"created_at"`
}

var (
	tasks   []Task
	nextID  int = 1
)

// ---- 1. 基本 Handler ----
func helloHandler(w http.ResponseWriter, r *http.Request) {
	// 设置响应头
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Hello, Go HTTP Server!\n")
	fmt.Fprintf(w, "请求路径: %s\n", r.URL.Path)
	fmt.Fprintf(w, "请求方法: %s\n", r.Method)
	fmt.Fprintf(w, "User-Agent: %s\n", r.UserAgent())
}

// ---- 2. JSON API Handler ----
func tasksHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		// GET /tasks — 返回所有任务
		json.NewEncoder(w).Encode(tasks)

	case http.MethodPost:
		// POST /tasks — 创建新任务
		var task Task
		if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
			http.Error(w, `{"error":"无效的 JSON"}`, http.StatusBadRequest)
			return
		}
		task.ID = nextID
		nextID++
		task.CreatedAt = time.Now()
		tasks = append(tasks, task)

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(task)

	default:
		http.Error(w, `{"error":"方法不允许"}`, http.StatusMethodNotAllowed)
	}
}

// ---- 3. Go 1.22+ 路径参数 ----
// 使用 {id} 语法匹配路径参数
func taskByIDHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// 从路径提取参数（Go 1.22+）
	id := r.PathValue("id")

	// 查找任务
	for _, task := range tasks {
		if fmt.Sprintf("%d", task.ID) == id {
			json.NewEncoder(w).Encode(task)
			return
		}
	}

	http.Error(w, `{"error":"任务不存在"}`, http.StatusNotFound)
}

// ---- 4. Middleware 模式 ----
// 日志中间件
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// 调用下一个 handler
		next.ServeHTTP(w, r)

		// 记录日志
		log.Printf("[%s] %s %s 耗时: %v",
			r.Method, r.URL.Path, r.RemoteAddr, time.Since(start))
	})
}

// ---- 5. 表单处理 ----
func formHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		// 解析表单
		r.ParseForm()
		name := r.FormValue("name")
		email := r.FormValue("email")

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprintf(w, "<h1>收到表单</h1>")
		fmt.Fprintf(w, "<p>姓名: %s</p>", name)
		fmt.Fprintf(w, "<p>邮箱: %s</p>", email)
		return
	}

	// GET 请求返回表单页面
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprint(w, `
		<h1>提交表单</h1>
		<form method="POST">
			姓名: <input type="text" name="name"><br>
			邮箱: <input type="email" name="email"><br>
			<input type="submit" value="提交">
		</form>
	`)
}

func main() {
	// 初始化示例数据
	tasks = []Task{
		{ID: 1, Title: "学习 Go 语言", Completed: false, CreatedAt: time.Now()},
		{ID: 2, Title: "写一个 Web 服务", Completed: true, CreatedAt: time.Now().Add(-time.Hour)},
	}
	nextID = 3

	// ---- 路由注册 ----

	// 基本路由
	http.HandleFunc("/", helloHandler)

	// REST API
	http.HandleFunc("/api/tasks", tasksHandler)

	// Go 1.22+ 路径参数
	http.HandleFunc("/api/tasks/{id}", taskByIDHandler)

	// 表单处理
	http.HandleFunc("/form", formHandler)

	// ---- 静态文件服务 ----
	// http.Handle("/static/", http.StripPrefix("/static/",
	//     http.FileServer(http.Dir("./static"))))

	// ---- 启动服务器 ----
	port := ":8080"
	fmt.Printf("服务器启动于 http://localhost%s\n", port)
	fmt.Printf("可用接口:\n")
	fmt.Printf("  GET  /                    - 欢迎页\n")
	fmt.Printf("  GET  /api/tasks           - 获取所有任务\n")
	fmt.Printf("  POST /api/tasks           - 创建任务\n")
	fmt.Printf("  GET  /api/tasks/{id}      - 按 ID 获取任务\n")
	fmt.Printf("  GET/POST /form            - 表单处理\n")

	// 注意：这里为了简化，没有使用中间件包装
	// 实际使用：http.ListenAndServe(port, loggingMiddleware(http.DefaultServeMux))
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal("服务器启动失败:", err)
	}
}

// 编译运行：go run 01_http_server.go
// 启动后访问 http://localhost:8080
// 测试 API: curl http://localhost:8080/api/tasks
