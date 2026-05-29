// ============================================================
// 知识点：测试（testing 包）
//
// Go 内置 testing 包支持单元测试、基准测试和示例测试。
// 测试文件以 _test.go 结尾，函数以 Test 开头。
// 测试命令：go test
// 配合 go test 01_math.go 01_math_test.go -v 运行测试
// ============================================================

package main

import "fmt"

// ---- 被测试的函数 ----

// Add 返回两个整数的和
func Add(a, b int) int {
	return a + b
}

// Subtract 返回两个整数的差
func Subtract(a, b int) int {
	return a - b
}

// Divide 返回除法结果（整数除法和余数）
func Divide(a, b int) (int, int) {
	if b == 0 {
		return 0, 0
	}
	return a / b, a % b
}

// Factorial 计算阶乘（0! = 1）
func Factorial(n int) (int, error) {
	if n < 0 {
		return 0, fmt.Errorf("负数没有阶乘: %d", n)
	}
	if n == 0 || n == 1 {
		return 1, nil
	}
	result := 1
	for i := 2; i <= n; i++ {
		result *= i
	}
	return result, nil
}

// IsPrime 判断质数
func IsPrime(n int) bool {
	if n <= 1 {
		return false
	}
	for i := 2; i*i <= n; i++ {
		if n%i == 0 {
			return false
		}
	}
	return true
}

// ---- 编译方法 ----
// 测试：go test -v 01_math_test.go 01_math.go
// 覆盖率：go test -coverprofile=coverage.out
// 查看覆盖率：go tool cover -html=coverage.out
