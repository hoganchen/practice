// ============================================================
// 知识点：testing/synctest — 并发测试示例（测试文件）
//
// 演示 synctest 的虚拟时钟和气泡隔离特性。
//
// 运行方法：
//   GODEBUG=asynctimerchan=0 go test -v ./39_synctest/
// synctest 需要 GODEBUG=asynctimerchan=0 环境变量
// ============================================================

package main

import (
	"context"
	"testing"
	"time"

	"testing/synctest"
)

// -------- synctest 虚拟时钟：几乎瞬时完成 --------
func TestVirtualClock(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		start := time.Now() // 虚拟时钟起点：2000-01-01 UTC

		// 启动一个 goroutine 休眠 1 秒
		go func() {
			time.Sleep(1 * time.Second)
		}()

		// 主 goroutine 休眠 2 秒
		// 由于虚拟时钟在所有 goroutine 阻塞时跳跃前进，
		// 这个调用实际上不会等待真实时间
		time.Sleep(2 * time.Second)

		elapsed := time.Since(start)
		t.Logf("耗时: %v (真实时间应 << 2秒)", elapsed)
	})
}

// -------- synctest 测试 Context.WithTimeout --------
func TestContextWithTimeout(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithTimeout(t.Context(), 5*time.Second)
		defer cancel()

		// 等待不足超时时间
		time.Sleep(5*time.Second - time.Nanosecond)
		synctest.Wait()
		if err := ctx.Err(); err != nil {
			t.Fatalf("超时前不应取消: %v", err)
		}

		// 等待超过超时时间
		time.Sleep(2 * time.Nanosecond)
		synctest.Wait()
		if err := ctx.Err(); err != context.DeadlineExceeded {
			t.Fatalf("超时后应取消: %v", err)
		}
	})
}

// -------- synctest 测试 goroutine 同步 --------
func TestGoroutineOrdering(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		result := make(chan int, 1)

		go func() {
			result <- 42
		}()

		// Wait 会阻塞直到所有 goroutine 都 durably blocked
		// 即上面那个 goroutine 已经发送到 channel
		synctest.Wait()

		select {
		case v := <-result:
			t.Logf("接收到: %d", v)
		default:
			t.Fatal("channel 应在 Wait 后含有数据")
		}
	})
}
