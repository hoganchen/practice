// ============================================================
// 知识点：结构体嵌入（Embedding）
//
// Go 不像传统 OOP 语言有继承（extends）机制。
// 嵌入（Embedding）通过组合实现代码复用和类型提升。
// 嵌入的类型的字段和方法会被提升到外层类型。
// 这不是继承，是组合——Go 鼓励组合优于继承。
// ============================================================

package main

import "fmt"

// ---- 1. 基础类型嵌入 ----

// 可读可写日志器
type Logger struct{}

func (l Logger) LogInfo(msg string) {
	fmt.Println("[INFO]", msg)
}

func (l Logger) LogError(msg string) {
	fmt.Println("[ERROR]", msg)
}

// ---- 2. 结构体嵌入 ----

type Notifier struct{}

func (n Notifier) Notify(subject, message string) {
	fmt.Printf("[通知] 发送给 %s: %s\n", subject, message)
}

// ---- 3. 嵌入多个类型 ----
// Server 嵌入了 Logger 和 Notifier，拥有了它们的所有方法
type Server struct {
	Name     string
	Logger            // 嵌入 Logger
	Notifier          // 嵌入 Notifier
	Address  string
}

// ---- 4. 方法覆盖（Override） ----
// Server 可以定义自己的 LogInfo，覆盖 Logger 的 LogInfo
func (s Server) LogInfo(msg string) {
	fmt.Printf("[SERVER:%s] %s\n", s.Name, msg)
}

// ---- 5. 嵌入与接口 ----
type Writer interface {
	Write(p []byte) (n int, err error)
}

type FileWriter struct{}
func (f FileWriter) Write(p []byte) (n int, err error) {
	fmt.Printf("写入 %d 字节\n", len(p))
	return len(p), nil
}

// BufferedFileWriter 嵌入 FileWriter，自动实现了 Writer 接口
type BufferedFileWriter struct {
	FileWriter
	BufferSize int
}

func main() {
	// ---- 1. 基础嵌入 ----
	fmt.Println("--- 嵌入的使用 ---")
	server := Server{
		Name:    "APIServer",
		Address: ":8080",
	}

	// 可以直接调用嵌入类型的方法（提升）
	server.LogInfo("服务启动")       // 调用 Server 自己的 LogInfo（覆盖了 Logger 的）
	server.Logger.LogInfo("内部调用") // 显式调用 Logger 的 LogInfo
	server.LogError("连接超时")      // 继承 Logger 的 LogError（未覆盖）
	server.Notify("admin", "服务已启动") // 提升 Notifier 的方法

	// ---- 2. 嵌入字段的直接访问 ----
	fmt.Println("\n--- 字段提升 ---")
	type Base struct {
		ID   int
		Name string
	}

	type Derived struct {
		Base                   // 嵌入
		Extra string
		Name  string // 覆盖了 Base.Name
	}

	d := Derived{
		Base:  Base{ID: 1, Name: "内部名"},
		Extra: "额外字段",
		Name:  "外部名",
	}
	fmt.Println("Derived.Name:", d.Name)       // "外部名"（自己的）
	fmt.Println("Base.Name:", d.Base.Name)      // "内部名"（显式访问）
	fmt.Println("ID:", d.ID)                    // 1（提升 Base.ID）

	// ---- 3. 嵌入实现接口 ----
	fmt.Println("\n--- 嵌入实现接口 ---")
	bfw := BufferedFileWriter{
		FileWriter: FileWriter{},
		BufferSize: 4096,
	}
	// BufferedFileWriter 自动实现了 Writer 接口（因为 FileWriter 实现了）
	var w Writer = bfw
	w.Write([]byte("hello"))

	// ---- 4. 嵌入与初始化 ----
	fmt.Println("\n--- 初始化注意事项 ---")
	// 正确方式：显式初始化嵌入的字段
	svr := Server{
		Name:   "TestServer",
		Logger: Logger{},
		Address: ":9090",
	}
	_ = svr

	// ---- 5. 嵌入的真正意义：组合 ----
	fmt.Println("\n--- 组合优于继承 ---")
	// 嵌入实现了多个维度的复用
	type AdminServer struct {
		Server            // 继承 Server 的所有能力
		AdminToken string
	}

	admin := AdminServer{
		Server: Server{
			Name:    "AdminServer",
			Address: ":8443",
		},
		AdminToken: "secret-token",
	}
	admin.LogInfo("以管理员身份启动")
	admin.LogError("权限不足")
	admin.Notify("ops", "管理员服务器已启动")
}

// 编译运行：go run 03_embedding.go
