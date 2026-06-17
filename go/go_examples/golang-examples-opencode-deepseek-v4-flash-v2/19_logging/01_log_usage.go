// ============================================================================
// 知识点: log 包 - 日志记录
//
// 说明:
// - log 包提供简单的日志功能, 默认输出到 os.Stderr
// - log.Printf / log.Println / log.Fatalf / log.Panicf
// - log.Fatal 会调用 os.Exit(1), log.Panic 会触发 panic
// - log.SetFlags 设置日志格式: Ldate | Ltime | Lshortfile
// - log.New 创建自定义 Logger (指定输出目标和格式)
//
// 编译和运行:
//   go run 19_logging\01_log_usage.go
// ============================================================================

package main

import (
	"bytes"
	"fmt"
	"log"
	"os"
)

func main() {
	// 标准日志
	log.Println("这是普通日志")
	log.Printf("格式化日志: %s=%d", "count", 42)

	// 自定义日志格式
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.Println("带文件行号的日志")

	// 自定义 Logger
	var buf bytes.Buffer
	customLogger := log.New(&buf, "[CUSTOM] ", log.Ldate|log.Ltime)
	customLogger.Println("自定义 Logger 的消息")
	customLogger.Printf("记录数值: %d", 100)

	fmt.Println("缓冲区内容:")
	fmt.Println(buf.String())

	// 日志到文件
	file, err := os.Create("app.log")
	if err != nil {
		log.Fatal("创建日志文件失败:", err)
	}
	defer file.Close()
	defer os.Remove("app.log")

	fileLogger := log.New(file, "[FILE] ", log.LstdFlags)
	fileLogger.Println("应用启动")
	fileLogger.Println("处理请求 #1")
	fileLogger.Println("应用关闭")
	fmt.Println("日志已写入 app.log")
}
