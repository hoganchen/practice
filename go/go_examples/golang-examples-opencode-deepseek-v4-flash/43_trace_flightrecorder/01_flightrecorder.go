// ============================================================
// 知识点：runtime/trace.FlightRecorder — 飞行记录器（Go 1.25+）
//
// trace.FlightRecorder 是 Go 1.25 新增的轻量级运行时追踪工具。
// 它持续录制最近几秒的执行轨迹到内存环形缓冲区，
// 在关键时刻（如错误发生）转储到文件进行分析。
//
// 相比完整 trace 的优势：
//   1. 持续低开销运行
//   2. 只在需要时导出，避免大文件
//   3. 适合生产环境常驻
//
// 编译运行方法：
//   go run 01_flightrecorder.go
// ============================================================

package main

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime/trace"
	"sync"
	"time"
)

func main() {
	// -------- 创建 FlightRecorder --------
	fmt.Println("=== trace.FlightRecorder 示例 ===")

	fr := new(trace.FlightRecorder)
	fr.Start()

	// -------- 模拟工作负载（让 trace 数据积累）--------
	fmt.Println("录制追踪数据中...")
	workload()

	// -------- 将追踪数据导出到文件 --------
	tmpDir := os.TempDir()
	outPath := filepath.Join(tmpDir, "go_flight_trace.out")
	f, err := os.Create(outPath)
	if err != nil {
		fmt.Println("创建文件失败:", err)
		return
	}
	defer f.Close()

	_, err = fr.WriteTo(f)
	if err != nil {
		fmt.Println("写入追踪失败:", err)
		return
	}
	fmt.Println("追踪数据已写入:", outPath)

	// 停止录制
	fr.Stop()

	// -------- 查看追踪文件 --------
	info, _ := f.Stat()
	fmt.Printf("追踪文件大小: %d 字节\n", info.Size())

	fmt.Println("\n使用以下命令查看追踪:")
	fmt.Printf("  go tool trace %s\n", outPath)
}

// workload 模拟一些 CPU 和 goroutine 活动
func workload() {
	var wg sync.WaitGroup
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			sum := 0
			for j := 0; j < 1000000; j++ {
				sum += j
			}
			_ = sum
		}(i)
	}
	wg.Wait()
	time.Sleep(10 * time.Millisecond)

	// 模拟 GC 活动
	var data []int
	for i := 0; i < 5; i++ {
		data = make([]int, 10000)
		_ = data
	}
}
