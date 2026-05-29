// ============================================================
// 知识点：高级测试（被测试文件）
//
// 配合 01_math_test.go 演示：
//   - testing.B.Loop() 基准测试（Go 1.24+）
//   - 表驱动测试
//   - Fuzz 测试
//
// 运行测试：
//   go test -v -bench=. ./33_testing_advanced/
// ============================================================

package testing_advanced

import "errors"

func Add(a, b int) int {
	return a + b
}

func IsPrime(n int) bool {
	if n < 2 {
		return false
	}
	for i := 2; i*i <= n; i++ {
		if n%i == 0 {
			return false
		}
	}
	return true
}

func Divide(a, b int) (int, error) {
	if b == 0 {
		return 0, errors.New("除数不能为零")
	}
	return a / b, nil
}

func Sum(n int) int {
	total := 0
	for i := 0; i < n; i++ {
		total += i
	}
	return total
}
