// ============================================================
// 知识点：Channel（通道）
//
// Channel 是 goroutine 之间的通信管道。
// 类型：chan T — 发送 T 类型数据的通道
// 创建：make(chan T)
// 发送：ch <- value
// 接收：value := <-ch
//
// 核心特性：
// 1. 默认是阻塞的（发送和接收都会阻塞直到对方就绪）
// 2. 无缓冲通道需要发送和接收同时就绪
// 3. 通道可以关闭（close），关闭后不能发送但可以接收剩余数据
//
// 编译运行方法：
//   go run 01_channels.go
// ============================================================

package main

import (
	"fmt"
	"time"
)

// -------- 通过 channel 发送数据到 goroutine --------
func worker(id int, jobs <-chan int, results chan<- int) {
	for job := range jobs { // 从通道接收直到关闭
		fmt.Printf("Worker #%d 处理任务 %d\n", id, job)
		time.Sleep(200 * time.Millisecond)
		results <- job * 2 // 发送结果
	}
}

func main() {
	// -------- 基本 channel 使用 --------
	fmt.Println("=== 基本 channel ===")
	ch := make(chan string)

	// 在 goroutine 中发送
	go func() {
		time.Sleep(100 * time.Millisecond)
		ch <- "来自 goroutine 的消息"
	}()

	// 主 goroutine 接收（阻塞直到收到消息）
	msg := <-ch
	fmt.Println(msg)

	// -------- 工作池模式 --------
	fmt.Println("\n=== 工作池模式 ===")
	const numJobs = 5
	const numWorkers = 3

	jobs := make(chan int, numJobs)
	results := make(chan int, numJobs)

	// 启动 workers
	for w := 1; w <= numWorkers; w++ {
		go worker(w, jobs, results)
	}

	// 发送任务
	for j := 1; j <= numJobs; j++ {
		jobs <- j
	}
	close(jobs) // 关闭 jobs 通道，通知 workers 没有更多任务了

	// 收集结果
	for r := 1; r <= numJobs; r++ {
		<-results
	}
	fmt.Println("所有任务完成！")
}
