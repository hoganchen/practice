// ============================================================================
// 知识点: select 多路复用
//
// 说明:
// - select 等待多个 channel 操作中的一个就绪
// - 如果多个 channel 同时就绪, 随机选择一个执行
// - default 分支用于非阻塞操作
// - select 与 for 循环结合实现持续监听
// - nil channel 在 select 中永远不会被选择
// - 空 select {} 会永久阻塞
//
// 编译和运行:
//   go run 15_concurrency\03_select.go
// ============================================================================

package main

import (
	"fmt"
	"time"
)

func main() {
	ch1 := make(chan string)
	ch2 := make(chan string)

	// goroutine 1: 每50ms发送
	go func() {
		for i := 0; i < 3; i++ {
			time.Sleep(50 * time.Millisecond)
			ch1 <- fmt.Sprintf("来自ch1的消息 #%d", i)
		}
		close(ch1)
	}()

	// goroutine 2: 每80ms发送
	go func() {
		for i := 0; i < 3; i++ {
			time.Sleep(80 * time.Millisecond)
			ch2 <- fmt.Sprintf("来自ch2的消息 #%d", i)
		}
		close(ch2)
	}()

	// select 多路复用
	done1, done2 := false, false
	for !done1 || !done2 {
		select {
		case msg, ok := <-ch1:
			if !ok {
				done1 = true
				fmt.Println("ch1 已关闭")
				continue
			}
			fmt.Println(msg)
		case msg, ok := <-ch2:
			if !ok {
				done2 = true
				fmt.Println("ch2 已关闭")
				continue
			}
			fmt.Println(msg)
		case <-time.After(200 * time.Millisecond):
			fmt.Println("超时: 200ms 无响应")
		}
	}
}
