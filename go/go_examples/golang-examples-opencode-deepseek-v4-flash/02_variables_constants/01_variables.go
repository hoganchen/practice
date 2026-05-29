// ============================================================
// 知识点：变量声明与赋值
//
// Go 是静态类型语言，变量声明后类型不可变。
// Go 提供了多种变量声明方式，类型推断是其重要特性。
//
// 编译运行方法：
//   go run 01_variables.go
// ============================================================

package main

import "fmt"

func main() {
	// -------- 方式1：var 声明变量，指定类型 --------
	var age int       // 声明 int 类型变量，默认值为 0
	age = 30          // 赋值
	fmt.Println("age:", age)

	// -------- 方式2：var 声明并初始化 --------
	var name string = "张三"
	fmt.Println("name:", name)

	// -------- 方式3：短变量声明（:=），类型由值推断 --------
	// 只能在函数内部使用
	count := 100              // 被推断为 int
	price := 19.99            // 被推断为 float64
	isOK := true              // 被推断为 bool
	message := "Hello"        // 被推断为 string
	fmt.Println(count, price, isOK, message)

	// -------- 方式4：多变量同时声明 --------
	var x, y int = 10, 20
	var a, b = "hello", 42
	c, d := 3.14, true
	fmt.Println(x, y, a, b, c, d)

	// -------- 方式5：批量声明（var 块） --------
	var (
		firstName string = "李"
		lastName  string = "四"
		height    int    = 180
	)
	fmt.Println(firstName, lastName, height)

	// -------- 零值（Zero Values）--------
	// Go 中变量声明后会自动初始化为其类型的零值
	var (
		ivalue  int       // 0
		fvalue  float64   // 0.0
		bvalue  bool      // false
		svalue  string    // ""（空字符串）
		pvalue  *int      // nil（指针类型零值是 nil）
	)
	fmt.Println("零值:", ivalue, fvalue, bvalue, svalue, pvalue)
}
