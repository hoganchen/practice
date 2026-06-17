// ============================================================================
// 知识点: for range 遍历整数 (Go 1.22+)
//
// 说明:
// - Go 1.22+ 支持 for i := range N 语法, N 为整数
// - 等价于 for i := 0; i < N; i++
// - 简化了简单的循环计数场景
// - 变量的行为与普通 for 循环相同 (每次迭代创建新变量, Go 1.22+)
//
// 编译和运行:
//   go run 04_control_flow\05_range_over_int.go
// ============================================================================

package main

import "fmt"

func main() {
	// 基本用法: 遍历 0..4
	fmt.Println("range 5:")
	for i := range 5 {
		fmt.Printf("  %d ", i)
	}
	fmt.Println()

	// 模拟星期
	days := []string{"一", "二", "三", "四", "五", "六", "日"}
	fmt.Println("工作日:")
	for i := range 5 {
		fmt.Printf("  星期%s ", days[i])
	}
	fmt.Println()

	// 配合条件判断
	for i := range 10 {
		if i%2 == 0 {
			fmt.Printf("  %d 是偶数\n", i)
		}
	}
}
