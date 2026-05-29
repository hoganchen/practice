// ============================================================
// 知识点：sync.WaitGroup（等待组）
//
// WaitGroup 用于等待一组 goroutine 完成。
// 三个方法：
//   Add(delta) — 增加计数器
//   Done() — 减少计数器（通常用 defer 调用）
//   Wait() — 阻塞直到计数器为 0
//
// 编译运行方法：
//   go run 01_waitgroup.go
// ============================================================

package main

import (
	"fmt"
	"sync"
	"time"
)

func worker(id int) {
	fmt.Printf("Worker %d 开始工作\n", id)
	time.Sleep(time.Duration(id) * 200 * time.Millisecond)
	fmt.Printf("Worker %d 完成\n", id)
}

func main() {
	fmt.Println("=== sync.WaitGroup 示例 ===")

	var wg sync.WaitGroup

	// 启动 5 个 worker
	for i := 1; i <= 5; i++ {
		wg.Add(1) // 计数器 +1

		// 在每个 goroutine 内部调用 Done()
		go func(id int) {
			defer wg.Done() // 计数器 -1
			worker(id)
		}(i)
	}

	// 等待所有 worker 完成
	wg.Wait()
	fmt.Println("所有 worker 已完成！")
}
