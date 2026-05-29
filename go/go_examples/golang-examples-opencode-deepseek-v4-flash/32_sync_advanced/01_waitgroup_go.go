// ============================================================
// 知识点：sync.WaitGroup.Go()（Go 1.25+）
//
// Go 1.25 为 sync.WaitGroup 新增了 Go 方法：
//   func (wg *WaitGroup) Go(f func())
//
// 它等效于：
//   wg.Add(1)
//   go func() {
//       defer wg.Done()
//       f()
//   }()
//
// 这比传统模式更简洁，且避免了忘记 Add/Done 的安全风险。
//
// 编译运行方法：
//   go run 01_waitgroup_go.go
// ============================================================

package main

import (
	"fmt"
	"sync"
	"time"
)

func process(id int) {
	// 模拟耗时操作
	time.Sleep(time.Duration(id) * 100 * time.Millisecond)
	fmt.Printf("任务 %d 完成\n", id)
}

func main() {
	// -------- 传统方式（Add + Done）--------
	fmt.Println("=== 传统方式 ===")
	var wg sync.WaitGroup
	for i := 1; i <= 3; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			process(id)
		}(i)
	}
	wg.Wait()
	fmt.Println("传统方式完成")

	// -------- Go 1.25 新增的 wg.Go --------
	// wg.Go(f) 自动调用 Add(1)，并在 f 完成后自动 Done()
	fmt.Println("\n=== WaitGroup.Go() 新方式 (Go 1.25) ===")
	var wg2 sync.WaitGroup

	for i := 4; i <= 6; i++ {
		id := i
		wg2.Go(func() {
			process(id)
		})
	}
	wg2.Wait()
	fmt.Println("新方式完成")
}
