// ============================================================================
// 知识点: 零值机制
//
// 说明:
// - Go语言中, 变量声明后如果没有显式初始化, 会被赋予零值
// - 零值机制确保变量总是有安全的初始值, 避免未初始化变量的风险
// - 各种类型的零值:
//   - 数值类型: 0
//   - bool类型: false
//   - 字符串类型: "" (空字符串)
//   - 指针、切片、映射、通道、接口: nil
//
// 编译和运行:
//   go run 02_variables\03_zero_values.go
// ============================================================================

package main

import "fmt"

func main() {
	var i int
	var f float64
	var b bool
	var s string
	var p *int
	var sl []int
	var m map[string]int

	fmt.Println("int 零值:", i)
	fmt.Println("float64 零值:", f)
	fmt.Println("bool 零值:", b)
	fmt.Println("string 零值:", fmt.Sprintf("%q", s))
	fmt.Println("指针零值:", p)
	fmt.Println("切片零值:", sl, "长度:", len(sl))
	fmt.Println("映射零值:", m, "是否为 nil:", m == nil)
}
