// ============================================================
// 知识点：Context（上下文）
//
// context 包用于在 goroutine 之间传递上下文信息，
// 包括取消信号、超时、截止时间和请求范围的值。
//
// 核心函数：
//   context.Background() — 根 Context，通常在 main 函数
//   context.WithCancel() — 可取消的 Context
//   context.WithTimeout() — 带超时的 Context
//   context.WithValue() — 带值的 Context
//
// 编译运行方法：
//   go run 01_context.go
// ============================================================

package main

import (
	"context"
	"fmt"
	"time"
)

// -------- 模拟一个耗时操作 --------
func doWork(ctx context.Context, name string, duration time.Duration) {
	select {
	case <-time.After(duration):
		fmt.Printf("%s 完成\n", name)
	case <-ctx.Done():
		fmt.Printf("%s 被取消: %v\n", name, ctx.Err())
	}
}

func main() {
	// -------- WithCancel：手动取消 --------
	fmt.Println("=== WithCancel ===")
	ctx, cancel := context.WithCancel(context.Background())

	go doWork(ctx, "任务A", 2*time.Second)

	time.Sleep(500 * time.Millisecond)
	cancel() // 取消 Context
	time.Sleep(500 * time.Millisecond)

	// -------- WithTimeout：超时控制 --------
	fmt.Println("\n=== WithTimeout ===")
	ctx2, cancel2 := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel2() // 确保资源释放

	go doWork(ctx2, "任务B", 2*time.Second) // 会超时
	go doWork(ctx2, "任务C", 500*time.Millisecond) // 能完成

	time.Sleep(2 * time.Second)

	// -------- WithDeadline：截止时间 --------
	fmt.Println("\n=== WithDeadline ===")
	deadline := time.Now().Add(800 * time.Millisecond)
	ctx3, cancel3 := context.WithDeadline(context.Background(), deadline)
	defer cancel3()

	go doWork(ctx3, "任务D", 1*time.Second) // 会超时
	go doWork(ctx3, "任务E", 400*time.Millisecond) // 能完成

	time.Sleep(2 * time.Second)

	// -------- WithValue：传递请求级别数据 --------
	fmt.Println("\n=== WithValue ===")
	ctx4 := context.WithValue(context.Background(), "userID", "u-12345")
	ctx4 = context.WithValue(ctx4, "requestID", "req-67890")

	processRequest(ctx4)
}

func processRequest(ctx context.Context) {
	userID := ctx.Value("userID")
	requestID := ctx.Value("requestID")
	fmt.Printf("处理请求: userID=%v, requestID=%v\n", userID, requestID)
}
