// ============================================================================
// 知识点: runtime 包 - 运行时信息
//
// 说明:
// - runtime 提供与 Go 运行时交互的功能
// - runtime.NumGoroutine 当前 goroutine 数量
// - runtime.GOMAXPROCS 设置/获取 CPU 核心数
// - runtime.GOOS / GOARCH 获取操作系统和架构
// - runtime.Caller / Callers 获取调用栈信息
// - runtime.ReadMemStats 读取内存统计
// - runtime.GC 手动触发 GC
//
// 编译和运行:
//   go run 43_runtime\01_runtime_basics.go
// ============================================================================

package main

import (
	"fmt"
	"runtime"
)

func printMemStats() {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	fmt.Printf("  Alloc: %d KB, TotalAlloc: %d KB, Sys: %d KB, NumGC: %d\n",
		m.Alloc/1024, m.TotalAlloc/1024, m.Sys/1024, m.NumGC)
}

func main() {
	// 系统信息
	fmt.Println("系统信息:")
	fmt.Printf("  OS: %s / %s\n", runtime.GOOS, runtime.GOARCH)
	fmt.Printf("  GOMAXPROCS: %d\n", runtime.GOMAXPROCS(0))
	fmt.Printf("  NumCPU: %d\n", runtime.NumCPU())
	fmt.Printf("  GoVersion: %s\n", runtime.Version())
	fmt.Printf("  Compiler: %s\n", runtime.Compiler)

	// goroutine 信息
	fmt.Printf("\n初始 goroutine 数: %d\n", runtime.NumGoroutine())

	done := make(chan bool)
	for i := 0; i < 5; i++ {
		go func() {
			<-done
		}()
	}
	fmt.Printf("启动 5 个 goroutine 后: %d\n", runtime.NumGoroutine())
	close(done)

	// 内存统计
	fmt.Println("\n内存统计:")
	printMemStats()

	// 分配内存并观察
	data := make([]byte, 10*1024*1024) // 10 MB
	for i := range data {
		data[i] = byte(i)
	}
	fmt.Println("分配 10MB 后:")
	printMemStats()

	// 手动 GC
	runtime.GC()
	fmt.Println("手动 GC 后:")
	printMemStats()

	// 调用栈信息
	fmt.Println("\n调用栈:")
	pc, file, line, ok := runtime.Caller(0)
	if ok {
		fn := runtime.FuncForPC(pc)
		fmt.Printf("  %s (%s:%d)\n", fn.Name(), file, line-1)
	}

	_ = data
}
