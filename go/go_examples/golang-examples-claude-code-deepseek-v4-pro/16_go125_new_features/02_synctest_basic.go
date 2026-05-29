// ============================================================
// 知识点：testing/synctest — 并发代码测试（Go 1.25 正式可用）
//
// testing/synctest 包提供虚拟时间（virtual time）环境，
// 让并发代码的测试变得确定、快速、无竞态。
//
// 核心函数：
//   synctest.Test(t, func(t *testing.T))  — 创建一个"气泡"（bubble），
//     气泡内的 goroutine 共享虚拟时间，time.Sleep 立即完成
//   synctest.Wait() — 等待气泡内所有 goroutine 进入阻塞状态
//
// 适用场景：
//   - 测试 time.Sleep/timer/Ticker 相关逻辑
//   - 测试 channel 通信模式
//   - 测试 context 超时/取消传播
// ============================================================

package main

import (
	"fmt"
)

// 注意：testing/synctest 需要在 _test.go 文件中使用，
// 且需要 Go 1.25+。
//
// 这里创建了同名的 _test.go 文件（02_synctest_basic_test.go），
// 其中包含完整的测试示例。
//
// 本文件仅作为文档说明，实际测试代码见 02_synctest_basic_test.go

func main() {
	fmt.Println("=== testing/synctest (Go 1.25+) ===")
	fmt.Println()
	fmt.Println("testing/synctest 包用于测试并发代码，提供：")
	fmt.Println("  1. 虚拟时间——time.Sleep 即时完成")
	fmt.Println("  2. 确定性调度——消除竞态条件")
	fmt.Println("  3. 快速执行——秒级测试毫秒级完成")
	fmt.Println()
	fmt.Println("用法：")
	fmt.Println("  synctest.Test(t, func(t *testing.T) {")
	fmt.Println("      // 在此气泡内，goroutine 使用虚拟时间")
	fmt.Println("      go func() {")
	fmt.Println("          time.Sleep(time.Hour)  // 瞬间完成")
	fmt.Println("      }()")
	fmt.Println("      synctest.Wait()  // 等待所有 goroutine 阻塞")
	fmt.Println("  })")
	fmt.Println()
	fmt.Println("运行测试：")
	fmt.Println("  go test -v ./16_go125_new_features/ -run TestSynctest")
	fmt.Println()
	fmt.Println("注意事项：")
	fmt.Println("  - 需要 Go 1.25+")
	fmt.Println("  - 仅跟踪气泡内的 goroutine")
	fmt.Println("  - 外部 I/O 不属于可阻塞操作")
	fmt.Println("  - 只有通道(气泡内创建)和 time.Sleep 支持虚拟化")
}

// 编译运行：请使用 go test（见 02_synctest_basic_test.go）
