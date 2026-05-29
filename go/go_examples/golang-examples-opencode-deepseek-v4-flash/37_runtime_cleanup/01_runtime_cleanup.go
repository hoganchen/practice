// ============================================================
// 知识点：runtime.AddCleanup — 资源清理（Go 1.24+）
//
// runtime.AddCleanup 是 Go 1.24 引入的新清理机制，
// 作为 runtime.SetFinalizer 的替代，更安全、更高效。
//
// AddCleanup(obj, cleanup, arg)：
//   obj — 需要监控的对象
//   cleanup — 清理函数（接收 arg 作为参数）
//   arg — 传递给 cleanup 的参数
//
// 与 SetFinalizer 的区别：
//   1. 不会阻止对象被回收（不延长对象生命周期）
//   2. 支持多个 Cleanup（同一对象可注册多个）
//   3. 参数类型安全
//   4. 更明确的语义
//
// 编译运行方法：
//   go run 01_runtime_cleanup.go
// ============================================================

package main

import (
	"fmt"
	"runtime"
	"runtime/debug"
	"time"
)

// -------- 模拟资源对象 --------
type Resource struct {
	Name string
}

// 通过 AddCleanup 注册的清理函数
func cleanupResource(name string) {
	fmt.Printf("[Cleanup] 资源 %q 已被 GC 回收\n", name)
}

// -------- 创建资源并注册清理 --------
func createResource(name string) *Resource {
	r := &Resource{Name: name}
	// AddCleanup 在对象被 GC 回收时调用 cleanupResource(name)
	runtime.AddCleanup(r, cleanupResource, name)
	return r
}

func main() {
	fmt.Println("=== runtime.AddCleanup 示例 ===")
	fmt.Println("(此示例可能需要 ~1 秒等待 GC)\n")

	// 关闭 GC 日志干扰
	debug.SetGCPercent(100)

	// 创建资源
	_ = createResource("文件句柄-01")
	_ = createResource("网络连接-02")
	_ = createResource("数据库池-03")

	fmt.Println("资源已创建并注册清理函数")
	fmt.Println("手动触发 GC...")

	// 多次触发 GC 确保回收
	for i := 0; i < 5; i++ {
		runtime.GC()
		runtime.GC()
		time.Sleep(100 * time.Millisecond)
	}

	// 等待一下让清理函数执行
	time.Sleep(200 * time.Millisecond)
	fmt.Println("\n=== 示例结束 ===")
}
