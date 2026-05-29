// ============================================================
// 知识点：sync.WaitGroup — 等待 goroutine 完成
//
// WaitGroup 用于等待一组 goroutine 完成。
// 主要方法：Add(delta)、Done()、Wait()
// 必须在 goroutine 外调用 Add，在 goroutine 内调用 Done。
// 推荐模式：defer wg.Done()，确保 panic 时也递减计数器。
// ============================================================

package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	// ---- 1. 基本 WaitGroup 模式 ----
	fmt.Println("--- 基本 WaitGroup 模式 ---")

	var wg sync.WaitGroup

	// 启动 3 个 worker
	for i := 1; i <= 3; i++ {
		wg.Add(1) // 计数 +1
		go func(id int) {
			defer wg.Done() // 计数 -1（推荐 defer）

			fmt.Printf("  Worker %d 开始\n", id)
			time.Sleep(time.Duration(id) * 50 * time.Millisecond)
			fmt.Printf("  Worker %d 结束\n", id)
		}(i)
	}

	wg.Wait() // 阻塞直到计数器归零
	fmt.Println("  所有 worker 完成！")

	// ---- 2. Add 的不同位置 ----
	fmt.Println("\n--- Add 的位置 ---")

	var wg2 sync.WaitGroup
	workers := []string{"A", "B", "C"}

	// 方法1：循环内 Add
	for _, name := range workers {
		wg2.Add(1)
		go func(n string) {
			defer wg2.Done()
			fmt.Printf("  Worker %s done\n", n)
		}(name)
	}

	// 方法2：已知数量时可以先 Add（等效）
	// wg2.Add(len(workers))

	wg2.Wait()

	// ---- 3. WaitGroup 与数据竞争 ----
	fmt.Println("\n--- 安全地收集结果 ---")

	var wg3 sync.WaitGroup
	results := make([]int, 5)

	for i := 0; i < 5; i++ {
		wg3.Add(1)
		go func(idx int) {
			defer wg3.Done()
			// 每个 goroutine 写独立索引，无竞争
			results[idx] = idx * idx
		}(i)
	}

	wg3.Wait()
	fmt.Println("  结果:", results) // [0 1 4 9 16]

	// ---- 4. 错误使用示例 ----
	fmt.Println("\n--- WaitGroup 常见错误 ---")

	// 错误1：在 goroutine 内部调用 Add（可能导致提前 Wait）
	/*
		var wgErr sync.WaitGroup
		go func() {
			wgErr.Add(1) // 错误！可能 Wait 已经开始了
			defer wgErr.Done()
			// 工作...
		}()
		wgErr.Wait() // 可能立即返回，因为此时 Add 还没执行
	*/

	// 正确：Add 必须在 goroutine 外部调用

	// ---- 5. 复制 WaitGroup（注意） ----
	fmt.Println("\n--- 不要复制 WaitGroup ---")

	var wg4 sync.WaitGroup
	wg4.Add(1)
	// 错误：复制 WaitGroup（结构体拷贝会复制内部状态）
	// someFunction(wg4)  // 传值会复制计数器
	// 正确：传指针
	someFunction(&wg4) // 后面定义

	wg4.Wait()
	fmt.Println("  通过指针传递正常")
}

// 接收 WaitGroup 指针
func someFunction(wg *sync.WaitGroup) {
	go func() {
		defer wg.Done()
		fmt.Println("  someFunction 中执行")
		time.Sleep(10 * time.Millisecond)
	}()
}

// ---- 补充：WaitGroup 与 Worker 池 ----
func workerPoolExample() {
	fmt.Println("\n--- Worker 池 + WaitGroup ---")

	const total = 10
	const workers = 3

	jobs := make(chan int, total)
	var wg sync.WaitGroup

	// 启动 workers
	for w := 1; w <= workers; w++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for job := range jobs {
				fmt.Printf("    Worker %d 处理任务 %d\n", id, job)
				time.Sleep(20 * time.Millisecond)
			}
		}(w)
	}

	// 发送任务
	for j := 1; j <= total; j++ {
		jobs <- j
	}
	close(jobs)

	wg.Wait()
	fmt.Println("    所有任务完成")
}

// 编译运行：go run 05_sync_waitgroup.go
