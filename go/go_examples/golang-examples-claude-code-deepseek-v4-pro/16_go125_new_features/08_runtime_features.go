// ============================================================
// 知识点：Go 1.25 运行时新特性
//
// 1. 容器感知的 GOMAXPROCS — 自动感知 cgroup CPU 限制
// 2. Green Tea GC（实验性）— 改进小对象标记
// 3. DWARF 5 调试信息 — 更小的二进制文件
//
// 这些是运行时 / 编译时特性，直接受益无需代码改动。
// ============================================================

package main

import (
	"fmt"
	"runtime"
	"runtime/debug"
)

func main() {
	// ---- 1. 容器感知 GOMAXPROCS ----
	fmt.Println("=== 容器感知 GOMAXPROCS (Go 1.25) ===")
	fmt.Println()
	fmt.Println("在 Linux 容器（Docker/Kubernetes）中，Go 1.25 自动：")
	fmt.Println("  1. 读取 cgroup CPU 限制")
	fmt.Println("  2. 自动设置 GOMAXPROCS 为容器可用的 CPU 数")
	fmt.Println("  3. 当容器 CPU 限制变化时动态更新")
	fmt.Println()
	fmt.Printf("当前 GOMAXPROCS: %d\n", runtime.GOMAXPROCS(0))
	fmt.Printf("逻辑 CPU 数: %d\n", runtime.NumCPU())
	fmt.Println()

	// 可以通过 GODEBUG、GOMAXPROCS 环境变量或 runtime.GOMAXPROCS() 禁用
	fmt.Println("禁用自动调整（方法之一）：")
	fmt.Println("  export GOMAXPROCS=4  # 显式设置后自动调整关闭")
	fmt.Println("  GODEBUG=containermaxprocs=0")
	fmt.Println()

	// ---- 2. Green Tea GC（实验性）----
	fmt.Println("=== Green Tea GC (实验性, Go 1.25) ===")
	fmt.Println()
	fmt.Println("通过 GOEXPERIMENT=greenteagc 启用：")
	fmt.Println("  1. 改善小对象标记/扫描性能")
	fmt.Println("  2. 更好的 CPU 缓存局部性")
	fmt.Println("  3. 对于 GC 密集型程序，降低 10-40% GC 开销")
	fmt.Println()
	fmt.Println("启用方法：")
	fmt.Println("  GOEXPERIMENT=greenteagc go build")
	fmt.Println()

	// 当前 GC 状态
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	fmt.Printf("当前 GC 次数: %d\n", m.NumGC)
	fmt.Printf("当前堆使用: %d MB\n", m.HeapAlloc/1024/1024)

	// ---- 3. DWARF 5 调试信息 ----
	fmt.Println()
	fmt.Println("=== DWARF 5 调试信息 (Go 1.25) ===")
	fmt.Println()
	fmt.Println("Go 1.25 默认生成 DWARF 5 格式的调试信息：")
	fmt.Println("  1. 更小的二进制文件")
	fmt.Println("  2. 更快的链接速度")
	fmt.Println("  3. 更好的调试体验")
	fmt.Println()
	fmt.Println("禁用方法：")
	fmt.Println("  GOEXPERIMENT=nodwarf5 go build")

	// ---- 4. 编译与构建信息 ----
	fmt.Println()
	fmt.Println("=== 构建信息验证 ===")

	info, ok := debug.ReadBuildInfo()
	if ok {
		fmt.Printf("Go 版本: %s\n", info.GoVersion)
		fmt.Printf("主模块: %s %s\n", info.Main.Path, info.Main.Version)

		// 检查是否启用了实验特性
		for _, setting := range info.Settings {
			if setting.Key == "-tags" || setting.Key == "GOEXPERIMENT" {
				fmt.Printf("Build %s: %s\n", setting.Key, setting.Value)
			}
		}
	}

	// ---- 5. 注意事项 ----
	fmt.Println()
	fmt.Println("=== 运行时注意事项 ===")
	fmt.Println("  • GOMAXPROCS 自动调整仅在 Linux 容器中生效")
	fmt.Println("  • Green Tea GC 需要 GOEXPERIMENT 编译标记")
	fmt.Println("  • DWARF 5 是默认行为，通常无需干预")
	fmt.Println("  • 除 DWARF 5 外，这些特性都不需要代码修改")
}

// 编译运行：go run 08_runtime_features.go
// 需要 Go 1.25+
