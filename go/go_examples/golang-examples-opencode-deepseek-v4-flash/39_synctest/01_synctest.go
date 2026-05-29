// ============================================================
// 知识点：testing/synctest — 并发代码测试（Go 1.25 稳定版）
//
// synctest 包提供并发代码的隔离测试环境（"气泡"bubble）。
// 核心函数：
//   synctest.Test(t, f) — 在隔离气泡中运行 f，自动管理虚拟时钟
//   synctest.Wait() — 等待气泡中所有 goroutine 阻塞
//
// 在气泡中：
//   1. time 包使用虚拟时钟，时间在全部 goroutine 阻塞时跳跃前进
//   2. 气泡内的 channel/timer/ticker 与气泡绑定
//   3. 气泡外的操作不会意外唤醒气泡内的 goroutine
//
// 运行方法：
//   GODEBUG=asynctimerchan=0 go test -v ./39_synctest/
// （synctest 需要 asynctimerchan=0 的环境设置）
// ============================================================

package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	fmt.Println("=== testing/synctest 说明 ===")
	fmt.Println("synctest 用于在测试中模拟并发和时间，需要 go test 运行。")
	fmt.Println("")
	fmt.Println("关键特性：")
	fmt.Println("  1. 虚拟时钟：时间在全部 goroutine 阻塞时瞬时推进")
	fmt.Println("  2. 气泡隔离：channel/timer 与气泡绑定，外部操作会 panic")
	fmt.Println("  3. Wait()：等待所有 goroutine 完成或阻塞")
	fmt.Println("")
	fmt.Println("使用 synctest 的测试：")
	fmt.Println("  go test -v ./39_synctest/")
	fmt.Println("")
	fmt.Println("传统方式测试并发代码的问题：")
	fmt.Println("  - time.Sleep 让测试变慢")
	fmt.Println("  - 竞态条件导致测试不稳定（flaky tests）")
	fmt.Println("  - 难以测试超时和取消")
	fmt.Println("")
	fmt.Println("synctest 解决了这些问题，让并发测试变得确定性和快速。")
	fmt.Println("")

	// 演示传统方式的问题：需要真实等待
	fmt.Println("演示：并发 + Context 超时模式")
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	ch := make(chan string, 1)
	go func() {
		// 模拟耗时操作
		time.Sleep(100 * time.Millisecond)
		ch <- "result"
	}()

	select {
	case v := <-ch:
		fmt.Println("  收到结果:", v)
	case <-ctx.Done():
		fmt.Println("  超时:", ctx.Err())
	}
	fmt.Println("  (传统方式需等待真实 50ms)")
}
