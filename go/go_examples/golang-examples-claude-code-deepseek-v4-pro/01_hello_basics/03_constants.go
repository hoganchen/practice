// ============================================================
// 知识点：常量（Constants）
//
// Go 常量使用 const 关键字声明，编译时确定值。
// 常量可以是无类型的（untyped），自动推导精度。
// iota 是常量计数器，用于创建枚举风格的常量组。
// ============================================================

package main

import "fmt"

func main() {
	// ---- 1. 基本常量声明 ----
	const pi = 3.14159     // 无类型常量，默认浮点
	const greeting = "你好" // 无类型字符串常量
	fmt.Printf("pi = %.5f, greeting = %s\n", pi, greeting)

	// 常量可以指定类型
	const typedConst int = 100
	// typedConst = 200  // 编译错误：常量不可修改
	fmt.Println("typedConst =", typedConst)

	// ---- 2. iota — 枚举常量生成器 ----
	// iota 在每个 const 块中从 0 开始，每行递增 1
	const (
		Monday = iota // 0
		Tuesday       // 1
		Wednesday     // 2
		Thursday      // 3
		Friday        // 4
		Saturday      // 5
		Sunday        // 6
	)
	fmt.Printf("Monday=%d, Friday=%d, Sunday=%d\n", Monday, Friday, Sunday)

	// ---- 3. iota 跳过与复用 ----
	const (
		_  = iota          // 0，用 _ 跳过
		KB = 1 << (10 * iota) // 1 << 10 = 1024
		MB                   // 1 << 20
		GB                   // 1 << 30
		TB                   // 1 << 40
	)
	fmt.Printf("1 KB = %d bytes\n", KB)
	fmt.Printf("1 MB = %d bytes\n", MB)
	fmt.Printf("1 GB = %d bytes\n", GB)
	fmt.Printf("1 TB = %d bytes\n", TB)

	// ---- 4. 枚举状态码示例 ----
	type Status int
	const (
		Pending    Status = iota // 0
		Approved                 // 1
		Rejected                 // 2
	)
	fmt.Printf("Pending=%d, Approved=%d, Rejected=%d\n", Pending, Approved, Rejected)

	// ---- 5. 无类型常量的灵活性 ----
	const bigNumber = 1 << 100       // 无类型，可以非常大
	const precision = bigNumber >> 97 // 编译时可计算
	fmt.Println("precision =", precision) // 结果: 8
}

// 编译运行：go run 03_constants.go
