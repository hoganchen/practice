// ============================================================
// 知识点：context.AfterFunc / WithDeadlineCause（Go 1.21+）
//
// context.AfterFunc(ctx, f)：
//   注册一个函数 f，在 ctx 被取消时在独立 goroutine 中执行。
//   返回一个 stop 函数，调用后可取消注册。
//
// context.WithDeadlineCause(parent, deadline, cause)：
//   与 WithDeadline 类似，但在超时时返回指定的 cause error，
//   通过 ctx.Err() 可获取到自定义的错误原因。
//
// 编译运行方法：
//   go run 01_context_advanced.go
// ============================================================

package main

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"
)

func main() {
	// -------- context.AfterFunc --------
	fmt.Println("=== context.AfterFunc ===")
	ctx, cancel := context.WithCancel(context.Background())

	var wg sync.WaitGroup
	wg.Add(1)

	// 注册：当 ctx 被取消时，执行清理函数
	stop := context.AfterFunc(ctx, func() {
		defer wg.Done()
		fmt.Println("[AfterFunc] 上下文已取消，执行清理操作")
	})

	// 触发取消
	fmt.Println("取消上下文...")
	cancel()

	// 等待 AfterFunc 执行完成
	wg.Wait()

	// stop 返回 false 表示函数已执行或已被取消注册
	fmt.Println("stop() 返回:", stop())

	// -------- context.WithDeadlineCause --------
	fmt.Println("\n=== context.WithDeadlineCause ===")
	customCause := errors.New("自定义超时原因：服务器忙")

	ctx2, cancel2 := context.WithDeadlineCause(
		context.Background(),
		time.Now().Add(10*time.Millisecond), // 10ms 后超时
		customCause,
	)
	defer cancel2()

	// 等待超时
	<-ctx2.Done()
	fmt.Println("ctx.Err():", ctx2.Err())
	fmt.Println("context.Cause():", context.Cause(ctx2))

	// 使用 errors.Is 检查自定义 cause
	if errors.Is(context.Cause(ctx2), customCause) {
		fmt.Println("成功识别自定义超时原因!")
	}
}
