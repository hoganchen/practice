// ============================================================
// 知识点：带缓冲 Channel（Buffered Channel）
//
// 带缓冲的通道可以在没有接收者时缓存一定数量的元素。
// 创建：make(chan T, capacity)
// 当缓冲区未满时，发送不阻塞；缓冲区未空时，接收不阻塞。
// 缓冲区满时发送阻塞，缓冲区空时接收阻塞。
//
// 编译运行方法：
//   go run 02_buffered_channels.go
// ============================================================

package main

import "fmt"

func main() {
	// -------- 创建带缓冲通道 --------
	fmt.Println("=== 带缓冲通道 ===")
	ch := make(chan int, 3)

	// 缓冲区有容量，不需要同时有接收者
	ch <- 1
	ch <- 2
	ch <- 3

	fmt.Println("缓冲区长度:", len(ch)) // 已缓冲 3 个
	fmt.Println("缓冲区容量:", cap(ch)) // 总容量 3

	// 接收（先进先出）
	fmt.Println(<-ch) // 1
	fmt.Println(<-ch) // 2
	fmt.Println(<-ch) // 3

	// -------- 缓冲区满时阻塞演示 --------
	fmt.Println("\n=== 缓冲区满与 range 遍历 ===")
	bufCh := make(chan string, 2)
	bufCh <- "A"
	bufCh <- "B"
	// bufCh <- "C" // 这里会死锁！缓冲区已满且没有接收者

	// 使用 range 遍历通道（需要先关闭）
	close(bufCh) // 关闭后不能发送，但可以接收

	for msg := range bufCh {
		fmt.Println("收到:", msg)
	}

	// -------- 检查通道是否已关闭 --------
	fmt.Println("\n=== 通道关闭检测 ===")
	ch2 := make(chan int, 2)
	ch2 <- 10
	ch2 <- 20
	close(ch2)

	// 双返回值接收：val, ok := <-ch
	// ok 为 false 表示通道已关闭且无数据
	v1, ok1 := <-ch2
	fmt.Println("v1:", v1, "ok1:", ok1)

	v2, ok2 := <-ch2
	fmt.Println("v2:", v2, "ok2:", ok2)

	v3, ok3 := <-ch2
	fmt.Println("v3:", v3, "ok3:", ok3) // ok3 = false
}
