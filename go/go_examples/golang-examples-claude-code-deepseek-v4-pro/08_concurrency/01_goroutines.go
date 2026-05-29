// ============================================================
// 知识点：Goroutines（协程）
//
// goroutine 是 Go 的轻量级线程，由 Go 运行时管理。
// 使用 go 关键字启动，与函数调用类似。
// goroutine 是并发执行的，但不等同于并行（由 GOMAXPROCS 控制）。
// 主 goroutine（main 函数）退出后，所有 goroutine 终止。
// ============================================================

package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	// ---- 1. 基本 goroutine ----
	fmt.Println("--- 基本 goroutine ---")

	// 启动 goroutine（无参数）
	go sayHello()

	// 启动 goroutine（带参数——值拷贝）
	go func(msg string) {
		fmt.Println("匿名 goroutine:", msg)
	}("来自 goroutine 的消息")

	// ---- 2. 使用 WaitGroup 等待 goroutine 完成 ----
	fmt.Println("\n--- WaitGroup 等待 goroutine ---")

	var wg sync.WaitGroup

	wg.Add(2) // 等待 2 个 goroutine

	go func() {
		defer wg.Done()
		time.Sleep(100 * time.Millisecond)
		fmt.Println("  Goroutine 1 完成")
	}()

	go func() {
		defer wg.Done()
		time.Sleep(50 * time.Millisecond)
		fmt.Println("  Goroutine 2 完成")
	}()

	wg.Wait() // 等待所有 goroutine 完成
	fmt.Println("  所有 goroutine 完成")

	// ---- 3. 启动多个 goroutine ----
	fmt.Println("\n--- 批量启动 goroutine ---")

	var batchWg sync.WaitGroup
	for i := 1; i <= 5; i++ {
		batchWg.Add(1)
		id := i // Go 1.22 之前需要这个技巧，1.22+ 已修复
		go func() {
			defer batchWg.Done()
			time.Sleep(time.Duration(id) * 50 * time.Millisecond)
			fmt.Printf("  任务 %d 完成\n", id)
		}()
	}
	batchWg.Wait()
	fmt.Println("  所有批量任务完成")

	// ---- 4. goroutine 非阻塞特性 ----
	fmt.Println("\n--- goroutine 非阻塞 ---")

	go func() {
		for i := 0; i < 3; i++ {
			fmt.Println("  Goroutine 执行:", i)
			time.Sleep(10 * time.Millisecond)
		}
	}()

	// 主 goroutine 继续执行
	fmt.Println("  主 goroutine 继续工作...")
	time.Sleep(50 * time.Millisecond) // 给 goroutine 时间执行
	fmt.Println("  main 结束")

	// ---- 5. GOMAXPROCS 说明 ----
	fmt.Println("\n--- 并发与并行 ---")
	fmt.Println("  goroutine 是并发模型（concurrency）")
	fmt.Println("  并行（parallelism）依赖 GOMAXPROCS")
	fmt.Println("  默认使用所有 CPU 核心")
	fmt.Println("  可通过 runtime.GOMAXPROCS(n) 设置")

	// ---- 6. goroutine 不是终止即可靠 ----
	fmt.Println("\n--- 注意 ---")
	fmt.Println("  main 退出后所有 goroutine 会立即终止")
	fmt.Println("  请使用 WaitGroup / Channel 确保 goroutine 完成")
}

func sayHello() {
	fmt.Println("  [sayHello] 你好，来自 goroutine！")
}

// 编译运行：go run 01_goroutines.go
