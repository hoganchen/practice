// ============================================================
// 知识点：上下文（context 包）
//
// context 用于传递请求范围的值、取消信号和截止时间。
// 常用于：超时控制、goroutine 树传播取消、传递元数据。
// 两个根 context：context.Background()、context.TODO()
// 派生 context：WithCancel、WithTimeout、WithDeadline、WithValue
// 最佳实践：context 始终作为函数第一个参数（ctx context.Context）。
// ============================================================

package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	// ---- 1. WithCancel — 手动取消 ----
	fmt.Println("--- WithCancel ---")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel() // 确保资源释放！

	// 启动一个监听取消的 goroutine
	go func() {
		select {
		case <-ctx.Done():
			fmt.Println("  Worker1: 收到取消信号，退出")
		}
	}()

	time.Sleep(50 * time.Millisecond)
	cancel() // 发送取消信号
	time.Sleep(10 * time.Millisecond)
	fmt.Println("  已取消")

	// ---- 2. WithTimeout — 超时自动取消 ----
	fmt.Println("\n--- WithTimeout ---")

	// 创建一个 100ms 超时的 context
	ctx2, cancel2 := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel2()

	start := time.Now()
	<-ctx2.Done() // 等待超时或取消
	fmt.Printf("  超时发生，耗时: %v\n", time.Since(start))
	fmt.Printf("  超时原因: %v\n", ctx2.Err()) // context deadline exceeded

	// ---- 3. WithDeadline — 指定截止时间 ----
	fmt.Println("\n--- WithDeadline ---")

	deadline := time.Now().Add(200 * time.Millisecond)
	ctx3, cancel3 := context.WithDeadline(context.Background(), deadline)
	defer cancel3()

	<-ctx3.Done()
	fmt.Printf("  截止时间到达: %v\n", ctx3.Err())

	// ---- 4. WithValue — 传递请求范围的值 ----
	fmt.Println("\n--- WithValue ---")

	ctx4 := context.WithValue(context.Background(), "user_id", 42)
	ctx4 = context.WithValue(ctx4, "request_id", "req-abc-123")

	// 传递到函数
	processRequest(ctx4)

	// ---- 5. context 的树形传播 ----
	fmt.Println("\n--- 树形传播 ---")

	parentCtx, parentCancel := context.WithTimeout(context.Background(), 300*time.Millisecond)
	defer parentCancel()

	// 从父 context 派生子 context
	childCtx, childCancel := context.WithTimeout(parentCtx, 500*time.Millisecond)
	defer childCancel()

	// 子 context 的超时 > 父 context 的超时
	// 当父 context 先超时时，子 context 也会被取消
	<-parentCtx.Done()
	fmt.Printf("  父 context 已超时: %v\n", parentCtx.Err())
	fmt.Printf("  子 context 也被取消: %v\n", childCtx.Err())

	// ---- 6. 实际应用：带超时的操作 ----
	fmt.Println("\n--- 带超时的操作 ---")

	operation := func(ctx context.Context, name string, duration time.Duration) error {
		select {
		case <-time.After(duration):
			fmt.Printf("  %s 完成\n", name)
			return nil
		case <-ctx.Done():
			fmt.Printf("  %s 被取消: %v\n", name, ctx.Err())
			return ctx.Err()
		}
	}

	// 超时 150ms，操作需要 100ms（不会超时）
	ctx5, cancel5 := context.WithTimeout(context.Background(), 150*time.Millisecond)
	defer cancel5()
	operation(ctx5, "快操作", 100*time.Millisecond)

	// 超时 150ms，操作需要 300ms（会超时）
	ctx6, cancel6 := context.WithTimeout(context.Background(), 150*time.Millisecond)
	defer cancel6()
	err := operation(ctx6, "慢操作", 300*time.Millisecond)
	if err != nil {
		fmt.Printf("  错误: %v\n", err)
	}

	// ---- 7. context 的层级结构 ----
	fmt.Println("\n--- 层次化传播 ---")

	// 根 context
	rootCtx := context.Background()

	// API 层：设置超时
	apiCtx, apiCancel := context.WithTimeout(rootCtx, 500*time.Millisecond)
	defer apiCancel()

	// 数据库层：从 API 层派生（附加值）
	dbCtx := context.WithValue(apiCtx, "timeout_ms", 300)

	// HTTP 调用：从数据库层派生
	httpCtx, httpCancel := context.WithTimeout(dbCtx, 200*time.Millisecond)
	defer httpCtx.Done()
	_ = httpCancel

	// 当 apiCtx 超时时，dbCtx 和 httpCtx 也会被取消
	fmt.Println("  context 树形传播：父级取消，所有子级也取消")
}

// ---- 接收 context 作为第一个参数的函数 ----
func processRequest(ctx context.Context) {
	// 从 context 提取值
	userID := ctx.Value("user_id")
	requestID := ctx.Value("request_id")

	fmt.Printf("  处理请求: user_id=%v, request_id=%v\n", userID, requestID)

	// 检查 context 是否已取消
	select {
	case <-ctx.Done():
		fmt.Println("  context 已取消")
	default:
		fmt.Println("  context 仍有效")
	}
}

// 编译运行：go run 01_context.go
