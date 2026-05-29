// ============================================================
// 知识点：通道（Channel）
//
// Channel 是 goroutine 之间的通信管道。
// 类型：chan T（双向）、chan<- T（只发送）、<-chan T（只接收）
// 无缓冲通道：同步通信（发送和接收同时进行）
// 有缓冲通道：异步通信（缓冲区未满时非阻塞）
// close() 关闭通道，range 遍历通道直到关闭。
// ============================================================

package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	// ---- 1. 无缓冲 Channel（同步通信） ----
	fmt.Println("--- 无缓冲 Channel ---")
	// 无缓冲 channel 的发送和接收必须同时就绪，否则阻塞

	ch1 := make(chan string)

	go func() {
		message := "hello from channel"
		fmt.Println("  发送方: 准备发送...")
		ch1 <- message // 阻塞直到接收方就绪
		fmt.Println("  发送方: 发送完成")
	}()

	time.Sleep(100 * time.Millisecond) // 模拟延迟
	fmt.Println("  接收方: 准备接收...")
	msg := <-ch1 // 阻塞直到发送方就绪
	fmt.Println("  接收方: 收到:", msg)

	// ---- 2. 有缓冲 Channel ----
	fmt.Println("\n--- 有缓冲 Channel ---")
	// 缓冲区未满时，发送不阻塞；缓冲区非空时，接收不阻塞

	ch2 := make(chan int, 3)

	// 发送 3 个值（缓冲区大小 3，不会阻塞）
	for i := 1; i <= 3; i++ {
		ch2 <- i * 10
		fmt.Printf("  发送 %d，缓冲区长度: %d\n", i*10, len(ch2))
	}

	// 接收 3 个值
	for i := 1; i <= 3; i++ {
		val := <-ch2
		fmt.Printf("  接收 %d，缓冲区长度: %d\n", val, len(ch2))
	}

	// ---- 3. 使用 range 遍历 Channel ----
	fmt.Println("\n--- range 遍历 Channel ---")

	ch3 := make(chan int, 5)
	go func() {
		for i := 1; i <= 5; i++ {
			ch3 <- i
		}
		close(ch3) // 关闭通道，表示不会再发送
		fmt.Println("  发送方关闭通道")
	}()

	// range 自动检测通道关闭
	for val := range ch3 {
		fmt.Printf("  收到: %d\n", val)
	}
	fmt.Println("  通道已关闭，range 结束")

	// ---- 4. 判断通道是否关闭 ----
	fmt.Println("\n--- 判断关闭 ---")

	ch4 := make(chan int)
	close(ch4)

	// comma-ok 惯用法
	val, ok := <-ch4
	fmt.Printf("  从已关闭通道接收: val=%d, ok=%t\n", val, ok) // 0, false

	// ---- 5. 通道容量和长度 ----
	fmt.Println("\n--- cap 和 len ---")

	ch5 := make(chan string, 10)
	fmt.Printf("  创建时: len=%d, cap=%d\n", len(ch5), cap(ch5))

	ch5 <- "a"
	ch5 <- "b"
	fmt.Printf("  发送 2 个后: len=%d, cap=%d\n", len(ch5), cap(ch5))

	<-ch5
	fmt.Printf("  接收 1 个后: len=%d, cap=%d\n", len(ch5), cap(ch5))

	// ---- 6. Worker 池模式 ----
	fmt.Println("\n--- Worker 池模式 ---")

	const numJobs = 10
	const numWorkers = 3

	jobs := make(chan int, numJobs)
	results := make(chan int, numJobs)

	// 启动 worker
	var wgWorker sync.WaitGroup  // 注意：需要 import "sync"
	for w := 1; w <= numWorkers; w++ {
		wgWorker.Add(1)
		go func(id int) {
			defer wgWorker.Done()
			for job := range jobs {
				fmt.Printf("  Worker %d 处理任务 %d\n", id, job)
				time.Sleep(50 * time.Millisecond) // 模拟工作
				results <- job * 2
			}
		}(w)
	}

	// 发送任务
	for j := 1; j <= numJobs; j++ {
		jobs <- j
	}
	close(jobs) // 关闭 jobs，通知 worker 没有更多任务

	// 等待所有 worker 完成
	wgWorker.Wait()
	close(results) // 关闭 results

	// 收集结果
	var total int
	for result := range results {
		total += result
	}
	fmt.Printf("  所有任务完成，总和: %d\n", total)
}

// 编译运行：go run 02_channels.go
