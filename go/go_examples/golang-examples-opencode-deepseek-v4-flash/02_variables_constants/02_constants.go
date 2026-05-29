// ============================================================
// 知识点：常量（const）
//
// 常量是编译期确定的值，使用 const 关键字声明。
// 常量可以是字符、字符串、布尔或数值类型。
// iota 是 Go 中自动递增的常量生成器。
//
// 编译运行方法：
//   go run 02_constants.go
// ============================================================

package main

import "fmt"

func main() {
	// -------- 单个常量声明 --------
	const pi float64 = 3.14159
	const greeting = "你好，Go" // 类型可以省略（类型推断）
	fmt.Println("pi:", pi)
	fmt.Println("greeting:", greeting)

	// -------- 常量块与 iota --------
	// iota 在 const 块中从 0 开始递增
	const (
		Sunday = iota // 0
		Monday        // 1
		Tuesday       // 2
		Wednesday     // 3
		Thursday      // 4
		Friday        // 5
		Saturday      // 6
	)
	fmt.Println("Monday:", Monday, "Friday:", Friday)

	// -------- iota 的典型用法：定义位掩码 --------
	const (
		Read   = 1 << iota // 1 (1 << 0)
		Write              // 2 (1 << 1)
		Execute            // 4 (1 << 2)
	)
	fmt.Println("Read:", Read, "Write:", Write, "Execute:", Execute)

	// -------- 常量是编译期计算的 --------
	const (
		width  = 10
		height = 5
		area   = width * height // 编译时计算
	)
	fmt.Println("area:", area)
}
