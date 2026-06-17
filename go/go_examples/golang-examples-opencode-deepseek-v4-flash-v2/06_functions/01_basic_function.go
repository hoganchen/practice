// ============================================================================
// 知识点: 基本函数定义
//
// 说明:
// - 函数定义: func 函数名(参数列表) 返回值类型 { 函数体 }
// - 参数类型相同可以省略前面的类型名: a, b int
// - 函数可以返回多个值
// - Go支持命名返回值, 在函数体可以直接操作返回值变量
// - 函数是一等公民, 可以作为参数传递或赋值给变量
//
// 编译和运行:
//   go run 06_functions\01_basic_function.go
// ============================================================================

package main

import "fmt"

// 标准函数: 参数+返回值
func add(a int, b int) int {
	return a + b
}

// 参数类型简写
func multiply(a, b int) int {
	return a * b
}

// 命名返回值
func divide(a, b int) (quotient int, remainder int) {
	quotient = a / b
	remainder = a % b
	return // 裸返回, 返回命名返回值的当前值
}

// 函数作为值
func applyOperation(a, b int, op func(int, int) int) int {
	return op(a, b)
}

func main() {
	fmt.Println("add(10, 20):", add(10, 20))
	fmt.Println("multiply(6, 7):", multiply(6, 7))

	q, r := divide(17, 5)
	fmt.Printf("divide(17, 5): 商=%d, 余数=%d\n", q, r)

	// 函数作为参数
	result := applyOperation(8, 12, add)
	fmt.Println("applyOperation(8, 12, add):", result)

	// 函数赋值给变量
	sub := func(a, b int) int { return a - b }
	fmt.Println("匿名函数 sub(20, 8):", sub(20, 8))
}
