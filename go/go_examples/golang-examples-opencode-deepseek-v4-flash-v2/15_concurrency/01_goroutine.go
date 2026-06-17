// ============================================================================
// 知识点: Goroutine 协程
//
// 说明:
// - goroutine 是Go的轻量级线程, 由Go运行时管理
// - 使用 go 关键字启动 goroutine: go 函数名()
// - goroutine 的调度由 Go 运行时自动完成(非抢占式协作调度)
// - 启动成本极低(约2KB栈空间)
// - main 函数(主 goroutine)退出时, 所有 goroutine 立即终止
// - 使用 sync.WaitGroup 或 channel 等待 goroutine 完成
//
// 编译和运行:
//   go run 15_concurrency\01_goroutine.go
// ============================================================================

package main

import (
	"fmt"
	"sync"
	"time"
)

func printNumbers(id int, wg *sync.WaitGroup) {
	defer wg.Done()
	for i := 1; i <= 3; i++ {
		fmt.Printf("goroutine %d: %d\n", id, i)
		time.Sleep(10 * time.Millisecond)
	}
}

func main() {
	var wg sync.WaitGroup

	// 启动 3 个 goroutine
	for i := 1; i <= 3; i++ {
		wg.Add(1)
		go printNumbers(i, &wg)
	}

	fmt.Println("等待所有 goroutine 完成...")
	wg.Wait() // 等待所有 goroutine 结束
	fmt.Println("所有 goroutine 已完成!")
}
