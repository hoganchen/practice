// ============================================================
// 知识点：变量声明方式
//
// Go 是静态类型语言，变量类型在编译时确定。
// 支持多种声明语法，包括类型推断。
// ============================================================

package main

import "fmt"

func main() {
	// ---- 1. var 声明（显式类型） ----
	var name string = "Alice"
	var age int = 30
	fmt.Printf("姓名：%s，年龄：%d\n", name, age)

	// ---- 2. 类型推断（:= 短声明） ----
	// 短声明只能在函数内部使用，自动推断类型
	country := "中国"   // string
	population := 14.1e8 // float64（14.1 亿）
	fmt.Printf("国家：%s，人口：%.2f 亿\n", country, population/1e8)

	// ---- 3. 多变量同时声明 ----
	var x, y int = 10, 20
	a, b := "hello", true
	fmt.Printf("x=%d, y=%d, a=%s, b=%t\n", x, y, a, b)

	// ---- 4. 零值（Zero Values） ----
	// Go 中的变量如果没有显式初始化，会被赋予零值
	var (
		zeroInt    int     // 0
		zeroFloat  float64 // 0.0
		zeroBool   bool    // false
		zeroString string  // "" (空字符串)
		zeroSlice  []int   // nil
	)
	fmt.Printf("零值: int=%d, float=%.1f, bool=%t, string=%q, slice=%v\n",
		zeroInt, zeroFloat, zeroBool, zeroString, zeroSlice)

	// ---- 5. 交换变量的简洁语法 ----
	m, n := 1, 2
	m, n = n, m // 交换值，无需临时变量
	fmt.Printf("交换后: m=%d, n=%d\n", m, n)

	// ---- 6. 未使用变量与 _（空白标识符） ----
	// Go 不允许声明了却不使用变量（编译错误）
	// 使用 _ 忽略不需要的值
	unused := 42
	_ = unused // 用 _ 接收，编译器不再报错

	_, _ = fmt.Println("未使用变量问题已避免") // 抑制 lint 警告

	// 输出结果：
	// 姓名：Alice，年龄：30
	// 国家：中国，人口：14.10 亿
	// x=10, y=20, a=hello, b=true
	// 零值: int=0, float=0.0, bool=false, string="", slice=[] ...
}

// 编译运行：go run 02_variables.go
