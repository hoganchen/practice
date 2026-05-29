// ============================================================
// 知识点：select 多路复用
//
// select 语句让 goroutine 等待多个 channel 操作中的一个就绪。
// 同时监听多个 channel，任何一个有数据就执行其 case。
// 如果多个 channel 同时就绪，随机选择一个执行。
// default 分支在没有任何 channel 就绪时执行（非阻塞）。
// 常见用途：超时控制、优雅退出、多路复用。
// ============================================================

package main

import (
	"fmt"
	"time"
)

func main() {
	// ---- 1. 基本 select ----
	fmt.Println("--- 基本 select ---")

	ch1 := make(chan string)
	ch2 := make(chan string)

	go func() {
		time.Sleep(50 * time.Millisecond)
		ch1 <- "从 ch1 来"
	}()

	go func() {
		time.Sleep(100 * time.Millisecond)
		ch2 <- "从 ch2 来"
	}()

	// select 会阻塞直到某个 case 就绪
	select {
	case msg1 := <-ch1:
		fmt.Println("收到:", msg1)
	case msg2 := <-ch2:
		fmt.Println("收到:", msg2)
	}

	// ---- 2. select 实现超时控制 ----
	fmt.Println("\n--- 超时控制 ---")

	slowChan := make(chan string)

	go func() {
		time.Sleep(2 * time.Second) // 模拟慢操作
		slowChan <- "结果"
	}()

	select {
	case result := <-slowChan:
		fmt.Println("成功:", result)
	case <-time.After(500 * time.Millisecond):
		fmt.Println("超时！操作耗时超过 500ms")
	}
	// 输出：超时（因为 500ms < 2s）

	// ---- 3. select 的 default 分支 ----
	fmt.Println("\n--- 非阻塞操作 ---")

	ch := make(chan int, 1)
	ch <- 42

	// 非阻塞读取
	select {
	case val := <-ch:
		fmt.Printf("读到: %d\n", val)
	default:
		fmt.Println("没有数据可读")
	}

	// 非阻塞写入（即使通道满了也不会阻塞）
	select {
	case ch <- 100:
		fmt.Println("写入成功")
	default:
		fmt.Println("通道已满，无法写入")
	}

	// ---- 4. 无限循环 + select（多路复用） ----
	fmt.Println("\n--- 多路复用循环 ---")

	msgChan := make(chan string, 3)
	signal := make(chan bool)

	// 生产者
	go func() {
		for i := 1; i <= 5; i++ {
			msgChan <- fmt.Sprintf("消息 %d", i)
			time.Sleep(30 * time.Millisecond)
		}
		time.Sleep(100 * time.Millisecond)
		signal <- true
	}()

	// 多路复用循环
	running := true
	for running {
		select {
		case msg := <-msgChan:
			fmt.Printf("  收到: %s\n", msg)
		case <-signal:
			fmt.Println("  收到停止信号")
			running = false
		default:
			// 没有数据时不做任何事
			fmt.Print(".")
			time.Sleep(10 * time.Millisecond)
		}
	}
	fmt.Println("  循环结束")

	// ---- 5. select 的随机选择 ----
	fmt.Println("\n--- 随机选择 ---")

	c1 := make(chan string, 1)
	c2 := make(chan string, 1)
	c1 <- "a"
	c2 <- "b"

	// 当多个 case 同时就绪，select 随机选择一个
	for i := 0; i < 5; i++ {
		select {
		case v := <-c1:
			fmt.Printf("  选了 c1: %s\n", v)
		case v := <-c2:
			fmt.Printf("  选了 c2: %s\n", v)
		}
		// 用新值填充被消费的通道
		c1 <- "a"
		c2 <- "b"
	}

	// ---- 6. 空 select ----
	fmt.Println("\n--- 空 select ---")
	// select{} 会在没有任何 case 时永久阻塞
	// 常用于让 main goroutine 永久等待

	fmt.Println("  select{} 会永久阻塞，此处不演示")

	// ---- 7. 优雅退出模式 ----
	fmt.Println("\n--- 优雅退出 ---")

	worker := func(id int, quit <-chan bool) {
		for {
			select {
			case <-quit:
				fmt.Printf("  Worker %d 收到退出信号，清理中...\n", id)
				return
			default:
				// 模拟工作
				fmt.Printf("  Worker %d 工作中...\n", id)
				time.Sleep(50 * time.Millisecond)
			}
		}
	}

	quit := make(chan bool)
	go worker(1, quit)

	time.Sleep(120 * time.Millisecond)
	fmt.Println("  发送退出信号...")
	quit <- true
	time.Sleep(50 * time.Millisecond)
	fmt.Println("  退出完成")
}

// 编译运行：go run 04_select.go
