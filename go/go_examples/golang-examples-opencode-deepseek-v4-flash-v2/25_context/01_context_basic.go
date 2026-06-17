// ============================================================================
// 知识点: context.Context 基本使用
//
// 说明:
// - context 用于在 goroutine 之间传递截止时间、取消信号和请求范围值
// - context.Background() 返回根 context, 通常在 main 函数使用
// - context.TODO() 用于不确定使用什么 context 时
// - context.WithCancel 返回可取消的 context
// - 当 context 被取消时, 所有派生 context 也会被取消
//
// 编译和运行:
//   go run 25_context\01_context_basic.go
// ============================================================================

package main

import (
	"context"
	"fmt"
	"time"
)

func worker(ctx context.Context, id int) {
	for {
		select {
		case <-ctx.Done():
			fmt.Printf("Worker %d 收到取消信号: %v\n", id, ctx.Err())
			return
		default:
			fmt.Printf("Worker %d 工作中...\n", id)
			time.Sleep(100 * time.Millisecond)
		}
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())

	go worker(ctx, 1)
	go worker(ctx, 2)

	time.Sleep(250 * time.Millisecond)
	fmt.Println("主 goroutine 发送取消信号...")
	cancel() // 取消 context

	time.Sleep(50 * time.Millisecond)
	fmt.Println("程序结束")
}
