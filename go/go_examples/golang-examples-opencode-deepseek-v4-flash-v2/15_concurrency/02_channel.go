// ============================================================================
// 知识点: Channel (通道)
//
// 说明:
// - channel 是 goroutine 之间通信的主要方式 (CSP模型)
// - 创建: make(chan 类型) 或 make(chan 类型, 缓冲大小)
// - 无缓冲通道: 发送和接收必须同时就绪, 同步阻塞
// - 有缓冲通道: 缓冲区未满时发送不阻塞, 未空时接收不阻塞
// - 使用 close(ch) 关闭通道, 接收方通过 v, ok := <-ch 判断
// - range ch 可以持续读取直到通道关闭
//
// 编译和运行:
//   go run 15_concurrency\02_channel.go
// ============================================================================

package main

import "fmt"

func worker(id int, jobs <-chan int, results chan<- int) {
	for job := range jobs {
		fmt.Printf("工作者 %d 处理任务 %d\n", id, job)
		results <- job * 2
	}
}

func main() {
	const numJobs = 5
	jobs := make(chan int, numJobs)
	results := make(chan int, numJobs)

	// 启动 3 个 worker
	for w := 1; w <= 3; w++ {
		go worker(w, jobs, results)
	}

	// 发送任务
	for j := 1; j <= numJobs; j++ {
		jobs <- j
	}
	close(jobs) // 关闭任务通道, 通知 worker 结束

	// 收集结果
	for r := 1; r <= numJobs; r++ {
		result := <-results
		fmt.Printf("结果 %d: %d\n", r, result)
	}
}
