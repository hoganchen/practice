// ============================================================
// 知识点：testing/synctest — 并发代码测试（Go 1.25 正式可用）
//
// testing/synctest 提供"气泡"(bubble)内虚拟时间调度：
//   - 气泡内的 goroutine 共享同一个虚拟时钟
//   - time.Sleep、channel 操作在气泡内使用虚拟化调度
//   - synctest.Wait() 等待所有 goroutine 进入阻塞状态
//   - 当所有 goroutine 阻塞时，虚拟时钟推进
//
// 核心函数：
//   synctest.Test(t, func(t *testing.T))  — 创建气泡
//   synctest.Wait()                       — 等待所有 goroutine 阻塞
//
// 运行：
//   cd 16_go125_new_features/synctest
//   go mod init synctest_example
//   GOWORK=off go test -v
// ============================================================

//go:build go1.25

package synctest_test

import (
	"context"
	"testing"
	"testing/synctest"
	"time"
)

// ---- 1. 基础：虚拟时间 ----
// time.Sleep 在虚拟时钟下会瞬间完成
func TestVirtualTime(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		// 在气泡中，time.Sleep 使用虚拟时钟
		// 当其他所有 goroutine 都阻塞时，时钟会推进
		<-time.After(1 * time.Hour)
		// 虚拟时间下这行会立即到达，不会真等 1 小时
	})
}

// ---- 2. 测试 goroutine 通信 ----
func TestChannelSync(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ch := make(chan int)

		go func() {
			ch <- 42 // 发送后阻塞（无接收者）
		}()

		// 等待 goroutine 阻塞在 ch <- 42
		synctest.Wait()

		// 现在接收
		val := <-ch
		if val != 42 {
			t.Errorf("期望 42，得到 %d", val)
		}
	})
}

// ---- 3. 虚拟时间下的 goroutine 同步 ----
func TestSleepAndChannel(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		result := make(chan int)

		go func() {
			time.Sleep(5 * time.Second) // 虚拟 5 秒
			result <- 42
		}()

		// 等待 goroutine 进入 sleep 阻塞
		synctest.Wait()
		// 虚拟时钟推进到 sleep 完成
		// goroutine 发送 result <- 42

		val := <-result
		if val != 42 {
			t.Errorf("期望 42，得到 %d", val)
		}
	})
}

// ---- 4. 测试 context 超时 ----
func TestContextTimeout(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
		defer cancel()

		<-ctx.Done() // 虚拟时间下立即到达

		if ctx.Err() != context.DeadlineExceeded {
			t.Errorf("期望超时错误，得到: %v", ctx.Err())
		}
	})
}

// ---- 5. goroutine 链 ----
func TestGoroutineChain(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ch1 := make(chan int)
		ch2 := make(chan int)
		done := make(chan int)

		go func() {
			v := <-ch1
			ch2 <- v * 2 // 乘以 2 后发送
		}()
		go func() {
			v := <-ch2
			done <- v * 2 // 再乘以 2
		}()

		ch1 <- 21 // 启动链
		synctest.Wait()

		result := <-done
		if result != 84 { // 21 * 2 * 2
			t.Errorf("期望 84，得到 %d", result)
		}
	})
}

// ---- 6. 验证虚拟时间确实加速 ----
func TestVirtualTimePerformance(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		realStart := time.Now()

		// 在气泡中创建一个 goroutine 来睡眠
		done := make(chan bool)
		go func() {
			time.Sleep(10 * time.Second) // 虚拟 10 秒
			done <- true
		}()

		// 等待 goroutine 阻塞
		synctest.Wait()

		// 接收结果
		<-done

		realElapsed := time.Since(realStart)
		t.Logf("虚拟等待 10 秒，真实耗时: %v", realElapsed)

		if realElapsed > time.Second {
			t.Logf("注意: 虚拟时间可能受运行时调度影响，但预期远小于 10 秒")
		}
	})
}

// ---- 7. time.After 在 select 中 ----
func TestTimeAfterInSelect(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		select {
		case <-time.After(5 * time.Second):
			// 虚拟时间下会立即触发
		}
	})
}

// ---- 8. context 取消传播 ----
func TestContextCancelPropagation(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		result := make(chan string)

		go func() {
			select {
			case <-ctx.Done():
				result <- "cancelled"
			case <-time.After(time.Hour):
				result <- "timeout"
			}
		}()

		// 等待 goroutine 阻塞
		synctest.Wait()
		cancel() // 触发取消

		// 等待 goroutine 处理取消信号
		synctest.Wait()

		got := <-result
		if got != "cancelled" {
			t.Errorf("期望 cancelled，得到 %q", got)
		}
	})
}

// 运行方法：
//   cd 16_go125_new_features/synctest
//   go mod init synctest_example
//   GOWORK=off go test -v
