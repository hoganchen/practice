// ============================================================
// 知识点：Channel 方向
//
// Go 的 channel 可以指定方向（只发送或只接收），提高类型安全。
// chan<- T：只发送通道（send-only）
// <-chan T：只接收通道（receive-only）
// 方向通常在函数参数中使用，编译器强制检查。
// 双向通道可以隐式转换为单向通道。
// ============================================================

package main

import (
	"fmt"
	"sync"
	"time"
)

// ---- 1. 只发送参数（chan<- string） ----
// producer 只能发送到通道
func producer(id int, out chan<- string) {
	for i := 1; i <= 3; i++ {
		msg := fmt.Sprintf("生产者%d: 产品%d", id, i)
		fmt.Println("  ->", msg)
		out <- msg
		time.Sleep(20 * time.Millisecond)
	}
}

// ---- 2. 只接收参数（<-chan string） ----
// consumer 只能从通道接收
func consumer(id int, in <-chan string, done chan<- bool) {
	for msg := range in {
		fmt.Printf("    消费者%d 收到: %s\n", id, msg)
		time.Sleep(50 * time.Millisecond)
	}
	done <- true
}

// ---- 3. 双向转单向 ----
// 内部同时使用发送和接收，但对外暴露特定方向的通道
func startPipeline() (in chan<- int, out <-chan int) {
	ch := make(chan int, 5)
	result := make(chan int, 5)

	go func() {
		for val := range ch {
			result <- val * 2
		}
		close(result)
	}()

	return ch, result // 隐式转换为单向
}

func main() {
	// ---- 1. 单向通道参数用法 ----
	fmt.Println("--- 生产者-消费者 ---")

	var wg sync.WaitGroup
	ch := make(chan string, 5)

	// 启动生产者（只发送方向）
	wg.Add(1)
	go func() {
		defer wg.Done()
		producer(1, ch)
		producer(2, ch)
		close(ch) // 生产者关闭通道
		fmt.Println("  所有生产者完成")
	}()

	// 启动消费者（只接收方向）
	done := make(chan bool)
	go consumer(1, ch, done)

	// 等待消费者完成
	<-done
	wg.Wait()

	// ---- 2. 双向转单向 ----
	fmt.Println("\n--- 双向转单向 ---")

	in, out := startPipeline()

	// 通过 in（只发送）发送数据
	in <- 1
	in <- 2
	in <- 3
	close(in) // 关闭发送端

	// 通过 out（只接收）接收数据
	for val := range out {
		fmt.Printf("  管道输出: %d\n", val)
	}

	// ---- 3. 尝试错误方向（编译错误 - 取消注释看错误） ----
	/*
		// 以下代码无法编译：
		func readOnly(ch <-chan int) {
			ch <- 42  // 错误：不能发送到只接收通道
		}
		func writeOnly(ch chan<- int) {
			<-ch  // 错误：不能从只发送通道接收
		}
	*/
	fmt.Println("\n  单向通道的方向由编译器强制检查")
	fmt.Println("  这提高了代码的类型安全性")

	// ---- 4. 实际应用模式 ----
	fmt.Println("\n--- 方向在实际代码中的应用 ---")

	// 定义函数明确表达意图
	fanOut := func(source <-chan int, workers int) []<-chan int {
		channels := make([]<-chan int, workers)
		for i := 0; i < workers; i++ {
			ch := make(chan int)
			channels[i] = ch

			go func(out chan<- int) {
				defer close(out)
				for val := range source {
					out <- val * val
				}
			}(ch)
		}
		return channels
	}

	fanIn := func(channels []<-chan int) <-chan int {
		out := make(chan int)
		var wg sync.WaitGroup
		for _, ch := range channels {
			wg.Add(1)
			go func(c <-chan int) {
				defer wg.Done()
				for val := range c {
					out <- val
				}
			}(ch)
		}
		go func() {
			wg.Wait()
			close(out)
		}()
		return out
	}

	// 创建数字源
	nums := make(chan int, 10)
	go func() {
		for i := 1; i <= 6; i++ {
			nums <- i
		}
		close(nums)
	}()

	// Fan-Out: 3 个 worker 处理
	workers := fanOut(nums, 3)
	// Fan-In: 合并结果
	merged := fanIn(workers)

	// 收集结果
	fmt.Print("  fan-out/fan-in 结果: ")
	for val := range merged {
		fmt.Printf("%d ", val)
	}
	fmt.Println()
}

// 编译运行：go run 03_channel_directions.go
