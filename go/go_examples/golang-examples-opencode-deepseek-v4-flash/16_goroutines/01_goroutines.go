// ============================================================
// 知识点：Goroutine（轻量级线程）
//
// goroutine 是 Go 并发编程的核心，由 Go 运行时管理。
// 使用 go 关键字启动一个 goroutine，在函数调用前加 go。
// goroutine 是轻量级的（栈初始约 2KB），可同时运行数千甚至数万个。
//
// 注意：主函数返回后所有 goroutine 都会终止。
// 通常使用 sync.WaitGroup 或 channel 来等待 goroutine 完成。
//
// 编译运行方法：
//   go run 01_goroutines.go
// ============================================================

package main

import (
	"fmt"
	"sync"
	"time"
)

// -------- 一个会在 goroutine 中运行的函数 --------
func printNumbers(id int, wg *sync.WaitGroup) {
	defer wg.Done() // 完成时通知 WaitGroup

	for i := 1; i <= 3; i++ {
		fmt.Printf("Goroutine #%d: %d\n", id, i)
		time.Sleep(100 * time.Millisecond) // 模拟工作
	}
}

func main() {
	// -------- 使用 sync.WaitGroup 等待 goroutine --------
	fmt.Println("=== Goroutine 示例 ===")

	var wg sync.WaitGroup

	// 启动 3 个 goroutine
	for i := 1; i <= 3; i++ {
		wg.Add(1)                  // 增加等待计数器
		go printNumbers(i, &wg)    // 启动 goroutine
	}

	// 等待所有 goroutine 完成
	wg.Wait()
	fmt.Println("所有 goroutine 已完成！")

	// -------- 匿名函数 goroutine --------
	fmt.Println("\n=== 匿名函数 goroutine ===")
	var wg2 sync.WaitGroup

	for i := 0; i < 3; i++ {
		wg2.Add(1)
		// Go 1.22+ 修复了循环变量捕获问题
		// 旧版本需要：i := i
		go func(id int) {
			defer wg2.Done()
			fmt.Printf("匿名 goroutine #%d 执行中\n", id)
		}(i)
	}

	wg2.Wait()
	fmt.Println("匿名 goroutines 完成！")
}
