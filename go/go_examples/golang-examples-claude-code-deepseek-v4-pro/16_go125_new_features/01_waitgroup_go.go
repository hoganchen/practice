// ============================================================
// 知识点：sync.WaitGroup.Go() — Go 1.25 新增方法
//
// Go 1.25 为 sync.WaitGroup 新增了 Go() 方法，简化了
// goroutine 启动代码：自动调用 Add(1) 和 defer Done()。
// 同时也避免了常见错误（如忘记 Add、或 Add 位置不对）。
//
// 方法签名：
//   func (wg *WaitGroup) Go(f func())
//
// 效果等价于：
//   wg.Add(1)
//   go func() {
//       defer wg.Done()
//       f()
//   }()
// ============================================================

package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	// ---- 1. 基础用法：Go 1.25 新写法 ----
	fmt.Println("=== WaitGroup.Go() 基础用法 (Go 1.25+) ===")

	var wg sync.WaitGroup
	start := time.Now()

	// 并发执行 5 个任务
	for i := range 5 {
		id := i + 1
		// Go 方法自动调用 wg.Add(1) 和 defer wg.Done()
		// 利用 Go 1.22+ 的闭包语义，id 每次迭代都是新变量
		wg.Go(func() {
			workTime := time.Duration(id) * 50 * time.Millisecond
			time.Sleep(workTime)
			fmt.Printf("  任务 %d 完成 (耗时 %v)\n", id, workTime)
		})
	}

	wg.Wait() // 等待所有任务完成
	fmt.Printf("  所有任务完成，总耗时: %v\n", time.Since(start))

	// ---- 2. 对比旧写法（Go 1.24 及之前）----
	fmt.Println("\n=== 对比：Go 1.24 旧写法 ===")

	var wgOld sync.WaitGroup
	start = time.Now()

	for i := 0; i < 5; i++ {
		id := i + 1
		wgOld.Add(1) // 需要在 goroutine 外调用
		go func() {
			defer wgOld.Done() // 需要手动 defer
			workTime := time.Duration(id) * 50 * time.Millisecond
			time.Sleep(workTime)
			fmt.Printf("  (旧) 任务 %d 完成 (耗时 %v)\n", id, workTime)
		}()
	}

	wgOld.Wait()
	fmt.Printf("  (旧) 所有任务完成，总耗时: %v\n", time.Since(start))

	// ---- 3. WaitGroup.Go 与闭包捕获 ----
	fmt.Println("\n=== 闭包捕获与循环变量 ===")
	// Go 1.22+ 修复了循环变量问题，Go 1.25 的 wg.Go 因此受益

	var wg3 sync.WaitGroup
	values := []string{"Go", "1.25", "WaitGroup", "Go()"}
	for _, v := range values {
		wg3.Go(func() {
			// 得益于 Go 1.22+ 的循环变量语义，v 每次迭代都是新变量
			time.Sleep(10 * time.Millisecond)
			fmt.Printf("  处理: %s\n", v)
		})
	}
	wg3.Wait()
	fmt.Println("  所有值处理完成")

	// ---- 4. 使用注意 ----
	fmt.Println("\n=== 注意事项 ===")
	fmt.Println("  1. wg.Go 内部自动处理 Add/Done，无需手动调用")
	fmt.Println("  2. 如果 f 内部 panic，Go 方法不会调用 Done（避免竞态）")
	fmt.Println("  3. wg.Go 只接受 func()，无参数；需要通过闭包捕获外部变量")
	fmt.Println("  4. 需要 Go 1.25+ 才能编译")
}

// 编译运行：go run 01_waitgroup_go.go
// 需要 Go 1.25+
