// ============================================================
// 知识点：runtime/trace.FlightRecorder — 飞行记录器（Go 1.25）
//
// FlightRecorder 持续记录 Go 执行跟踪（execution trace）到
// 内存环形缓冲区，当重要事件发生时（如错误、慢请求），
// 调用 WriteTo 导出最近几秒的跟踪数据。
//
// 核心类型与函数：
//   type FlightRecorderConfig struct {
//       MinAge   time.Duration  // 至少保留多长时间的跟踪数据
//       MaxBytes int64          // 环形缓冲区最大字节数
//   }
//   func NewFlightRecorder(cfg FlightRecorderConfig) *FlightRecorder
//   func (r *FlightRecorder) Start() error
//   func (r *FlightRecorder) Stop() error
//   func (r *FlightRecorder) WriteTo(w io.Writer) (n int64, err error)
//   func (r *FlightRecorder) Enabled() bool
//
// 适用场景：
//   - 生产环境问题诊断
//   - 性能问题现场捕获
//   - 偶发错误的追踪
// ============================================================

package main

import (
	"fmt"
	"os"
	"runtime/trace"
	"time"
)

func main() {
	// ---- 1. 创建并启动 FlightRecorder ----
	fmt.Println("=== runtime/trace.FlightRecorder (Go 1.25+) ===")

	cfg := trace.FlightRecorderConfig{
		MinAge:   5 * time.Second, // 至少保留 5 秒跟踪
		MaxBytes: 1 << 20,         // 1 MB 环形缓冲区
	}

	fr := trace.NewFlightRecorder(cfg)
	if err := fr.Start(); err != nil {
		fmt.Printf("启动 FlightRecorder 失败: %v\n", err)
		fmt.Println("（可能已有 active trace 或其他 recorder 正在运行）")
		return
	}
	defer fr.Stop()

	fmt.Println("FlightRecorder 已启动")
	fmt.Printf("  配置: MinAge=%v, MaxBytes=%d\n", cfg.MinAge, cfg.MaxBytes)

	// ---- 2. 模拟执行一些工作 ----
	fmt.Println("\n执行工作负载...")

	// 一些计算工作
	fibonacci := func(n int) int {
		if n <= 1 {
			return n
		}
		a, b := 0, 1
		for i := 2; i <= n; i++ {
			a, b = b, a+b
		}
		return b
	}

	// 执行计算密集型任务
	for i := 0; i < 5; i++ {
		result := fibonacci(40)
		fmt.Printf("  fib(40) = %d\n", result)
		time.Sleep(100 * time.Millisecond) // 模拟 I/O
	}

	// ---- 3. 模拟"重要事件"并导出跟踪 ----
	fmt.Println("\n检测到重要事件（模拟），正在导出跟踪数据...")

	// 保存跟踪快照
	snapshotFile := "flight_snapshot.trace"
	if err := saveSnapshot(fr, snapshotFile); err != nil {
		fmt.Printf("保存跟踪快照失败: %v\n", err)
		return
	}

	// ---- 4. 查看和分析跟踪 ----
	fmt.Println("\n查看分析：")
	fmt.Printf("  go tool trace %s\n", snapshotFile)

	// ---- 5. 清理 ----
	os.Remove(snapshotFile)
	fmt.Println("  已清理临时文件")

	// ---- 6. 更多用法 ----
	fmt.Println("\n=== 进阶用法 ===")
	fmt.Println("  1. 信号触发：在 SIGUSR1 处理器中调用 WriteTo")
	fmt.Println("  2. 错误触发：在 recover 中保存现场")
	fmt.Println("  3. 慢请求追踪：耗时超过阈值时导出")
	fmt.Println("  4. 多路快照：可以多次调用 WriteTo，不会停止录制")
	fmt.Println()
	fmt.Println("注意事项：")
	fmt.Println("  - 同一时间只能有一个 FlightRecorder 或 trace.Start")
	fmt.Println("  - MaxBytes 约 10 MB/s 数据率（繁忙服务）")
	fmt.Println("  - 生产环境建议 MinAge 设置为 2× 目标窗口")
}

// ---- 导出跟踪快照 ----
func saveSnapshot(fr *trace.FlightRecorder, path string) error {
	if !fr.Enabled() {
		return fmt.Errorf("FlightRecorder 未启用")
	}

	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("创建文件失败: %w", err)
	}
	defer f.Close()

	n, err := fr.WriteTo(f)
	if err != nil {
		return fmt.Errorf("写入跟踪数据失败: %w", err)
	}

	fmt.Printf("  已导出 %d 字节到 %s\n", n, path)
	return nil
}

// ---- 模拟：在 HTTP handler 中触发 ----
// 实际应用中可以在中间件中使用：
//
// var flightRecorder *trace.FlightRecorder
//
// func middleware(next http.Handler) http.Handler {
//     return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
//         start := time.Now()
//         next.ServeHTTP(w, r)
//         if time.Since(start) > 5*time.Second {
//             saveSnapshot(flightRecorder, "slow_request.trace")
//         }
//     })
// }

// ---- 编译方法 ----
// go run 05_flight_recorder.go
// 需要 Go 1.25+

// ---- 输出文件分析方法 ----
// 1. go tool trace flight_snapshot.trace
// 2. 浏览器打开显示的 URL
// 3. 查看 goroutine 分析、网络阻塞、系统调用等
