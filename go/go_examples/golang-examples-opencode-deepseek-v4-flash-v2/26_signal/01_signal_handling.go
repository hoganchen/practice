// ============================================================================
// 知识点: 信号处理 (os/signal)
//
// 说明:
// - signal.Notify 注册要接收的信号
// - 常用于优雅关闭: 捕获 SIGINT/SIGTERM 后执行清理
// - signal.Stop 停止接收信号
// - syscall.SIGINT (Ctrl+C), syscall.SIGTERM (终止信号)
// - Windows 下支持的信号有限(SIGINT, SIGTERM)
//
// 编译和运行:
//   go run 26_signal\01_signal_handling.go
//   按 Ctrl+C 发送中断信号
// ============================================================================

package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// 创建信号通道
	sigCh := make(chan os.Signal, 1)

	// 注册要接收的信号
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	// 启动一个 goroutine 模拟工作
	go func() {
		for i := 1; ; i++ {
			fmt.Printf("服务运行中... (%d)\n", i)
			time.Sleep(1 * time.Second)
		}
	}()

	fmt.Println("按 Ctrl+C 停止服务")

	// 阻塞等待信号
	sig := <-sigCh
	fmt.Printf("\n收到信号: %v\n", sig)
	fmt.Println("执行清理...")
	time.Sleep(500 * time.Millisecond)
	fmt.Println("服务已优雅关闭")
}
