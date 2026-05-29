// ============================================================
// 知识点：select 多路复用
//
// select 让 goroutine 可以同时等待多个 channel 操作。
// select 会阻塞直到其中一个 case 可以执行。
// 多个 case 同时就绪时随机选择一个执行。
// 使用 default 子句实现非阻塞操作。
//
// 编译运行方法：
//   go run 01_select.go
// ============================================================

package main

import (
	"fmt"
	"time"
)

func main() {
	// -------- select 基本用法 --------
	fmt.Println("=== select 基本用法 ===")
	ch1 := make(chan string)
	ch2 := make(chan string)

	// 启动两个 goroutine 分别在延时后发送数据
	go func() {
		time.Sleep(100 * time.Millisecond)
		ch1 <- "来自通道1"
	}()
	go func() {
		time.Sleep(200 * time.Millisecond)
		ch2 <- "来自通道2"
	}()

	// select 等待任意一个通道就绪
	select {
	case msg1 := <-ch1:
		fmt.Println("收到:", msg1)
	case msg2 := <-ch2:
		fmt.Println("收到:", msg2)
	case <-time.After(500 * time.Millisecond):
		fmt.Println("超时了")
	}

	// -------- select 超时控制 --------
	fmt.Println("\n=== 超时控制 ===")
	slowCh := make(chan string)

	go func() {
		time.Sleep(2 * time.Second) // 模拟慢操作
		slowCh <- "终于完成了"
	}()

	select {
	case result := <-slowCh:
		fmt.Println(result)
	case <-time.After(500 * time.Millisecond):
		fmt.Println("操作超时！")
	}

	// -------- select 非阻塞操作 --------
	fmt.Println("\n=== 非阻塞通信 ===")
	fastCh := make(chan int, 1)
	fastCh <- 42

	// 尝试接收，如果通道无数据则执行 default
	select {
	case v := <-fastCh:
		fmt.Println("从通道收到:", v)
	default:
		fmt.Println("通道无数据")
	}

	// 尝试发送，如果通道满则执行 default
	select {
	case fastCh <- 100:
		fmt.Println("发送成功")
	default:
		fmt.Println("通道已满，发送失败")
	}

	// -------- select 循环监听多通道 --------
	fmt.Println("\n=== 多通道监听 ===")
	stop := make(chan bool)
	tick := time.NewTicker(300 * time.Millisecond)
	defer tick.Stop()

	go func() {
		time.Sleep(1 * time.Second)
		stop <- true
	}()

	done := false
	for !done {
		select {
		case <-tick.C:
			fmt.Println("滴答...")
		case <-stop:
			fmt.Println("收到停止信号！")
			done = true
		}
	}
}
