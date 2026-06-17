// ============================================================================
// 知识点: 可运行的测试代码入口
//
// 说明:
// - 这是一个简单的 main 函数, 用于展示被测试函数的使用
// - 被测试函数(Add, Subtract等)定义在此文件中
// - 实际的测试代码在 01_calc_test.go
// - 运行测试: go test ./29_testing/ -v
//
// 编译和运行:
//   go run 29_testing\01_calc_main.go
// ============================================================================

package main

import (
	"errors"
	"fmt"
)

var ErrDivisionByZero = errors.New("除数不能为零")

func Add(a, b int) int {
	return a + b
}

func Subtract(a, b int) int {
	return a - b
}

func Multiply(a, b int) int {
	return a * b
}

func Divide(a, b int) (int, error) {
	if b == 0 {
		return 0, ErrDivisionByZero
	}
	return a / b, nil
}

func IsEven(n int) bool {
	return n%2 == 0
}

func Factorial(n int) (int, error) {
	if n < 0 {
		return 0, fmt.Errorf("负数没有阶乘")
	}
	if n == 0 {
		return 1, nil
	}
	result := 1
	for i := 2; i <= n; i++ {
		result *= i
	}
	return result, nil
}

func main() {
	fmt.Println("Add(3, 4):", Add(3, 4))
	fmt.Println("Subtract(10, 3):", Subtract(10, 3))
	fmt.Println("Multiply(6, 7):", Multiply(6, 7))

	if result, err := Divide(10, 3); err == nil {
		fmt.Println("Divide(10, 3):", result)
	}

	fmt.Println("IsEven(7):", IsEven(7))
	fmt.Println("IsEven(8):", IsEven(8))

	if f, err := Factorial(5); err == nil {
		fmt.Println("Factorial(5):", f)
	}
}
