// ============================================================================
// 知识点: Context 超时控制
//
// 说明:
// - context.WithTimeout 创建带超时的 context
// - context.WithDeadline 创建带截止时间的 context
// - 超时后 context.Done() 通道会关闭
// - 常用于 HTTP 请求、数据库查询等需要超时控制的场景
// - 超时后应清理资源并返回
//
// 编译和运行:
//   go run 25_context\02_context_timeout.go
// ============================================================================

package main

import (
	"context"
	"fmt"
	"time"
)

func operation(ctx context.Context, name string, duration time.Duration) {
	select {
	case <-time.After(duration):
		fmt.Printf("%s 完成 (耗时 %v)\n", name, duration)
	case <-ctx.Done():
		fmt.Printf("%s 超时取消: %v\n", name, ctx.Err())
	}
}

func main() {
	// 设置 100ms 超时
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	// 启动两个操作
	go operation(ctx, "快速操作", 50*time.Millisecond)
	go operation(ctx, "慢速操作", 200*time.Millisecond)

	// 等待足够时间观察结果
	time.Sleep(300 * time.Millisecond)
	fmt.Println("主程序结束")
}
