// ============================================================
// 知识点：函数定义与使用
//
// Go 函数的核心概念：
// 1. 使用 func 关键字定义函数
// 2. 参数需指定类型，相同类型的连续参数可省略中间类型
// 3. 支持命名返回值（可简化 return 语句）
// 4. 函数是一等公民，可作为值传递
//
// 编译运行方法：
//   go run 01_functions.go
// ============================================================

package main

import "fmt"

// -------- 无参无返回值函数 --------
func sayHello() {
	fmt.Println("Hello!")
}

// -------- 带参数函数 --------
// 参数名在前，类型在后
func greet(name string) {
	fmt.Printf("你好，%s！\n", name)
}

// -------- 相同类型的连续参数可省略中间的类型 --------
func add(x, y int) int {
	return x + y
}

// -------- 命名返回值 --------
// 返回值可以在函数签名中命名，函数体内直接使用这些变量
func divide(a, b float64) (result float64, err error) {
	if b == 0 {
		err = fmt.Errorf("除数不能为零")
		return // 等价于 return result, err
	}
	result = a / b
	return // 裸返回（naked return），返回命名返回值当前的值
}

// -------- 函数作为值传递 --------
type operation func(int, int) int

func apply(a, b int, op operation) int {
	return op(a, b)
}

// -------- 匿名函数 --------
var multiply = func(a, b int) int {
	return a * b
}

func main() {
	sayHello()
	greet("张三")

	sum := add(10, 20)
	fmt.Println("10 + 20 =", sum)

	result, err := divide(10, 3)
	if err == nil {
		fmt.Println("10 / 3 =", result)
	}

	// 函数作为参数传递
	r := apply(6, 7, multiply)
	fmt.Println("6 * 7 =", r)

	// 内联匿名函数
	r2 := apply(10, 2, func(a, b int) int {
		return a / b
	})
	fmt.Println("10 / 2 =", r2)
}
