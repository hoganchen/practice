// ============================================================================
// 知识点: mylib 子模块 - 演示模块依赖
//
// 本文件是 44_modules/mylib 子模块的代码,
// 用于演示 Go module 的本地依赖和 replace 指令.
//
// 子模块初始化:
//   cd 44_modules/mylib
//   go mod init example.com/mylib
// ============================================================================

package mylib

import "errors"

// Add 返回两个整数的和
func Add(a, b int) int {
	return a + b
}

// Multiply 返回两个整数的乘积
func Multiply(a, b int) int {
	return a * b
}

// DivResult 除法结果
type DivResult struct {
	Quotient  int
	Remainder int
}

// Divide 执行带余数的除法
func Divide(a, b int) (DivResult, error) {
	if b == 0 {
		return DivResult{}, errors.New("除数不能为零")
	}
	return DivResult{Quotient: a / b, Remainder: a % b}, nil
}
