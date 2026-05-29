// ============================================================
// 知识点：单元测试（被测试文件）
//
// Go 内置测试工具：go test
// 测试文件命名：*_test.go
// 测试函数命名：TestXxx(t *testing.T)
// 运行：go test -v ./23_testing/
//
// 编译运行方法：
//   go test -v ./23_testing/
// ============================================================

package testing_example

// Add 返回两数之和
func Add(a, b int) int {
	return a + b
}

// Divide 返回两数之商和余数
func Divide(a, b int) (int, int) {
	if b == 0 {
		return 0, 0
	}
	return a / b, a % b
}

// IsEven 判断是否为偶数
func IsEven(n int) bool {
	return n%2 == 0
}

// Factorial 计算阶乘
func Factorial(n int) int {
	if n < 0 {
		return -1
	}
	if n <= 1 {
		return 1
	}
	result := 1
	for i := 2; i <= n; i++ {
		result *= i
	}
	return result
}

// Fib 计算斐波那契数列第 n 项
func Fib(n int) int {
	if n < 0 {
		return -1
	}
	if n <= 1 {
		return n
	}
	return Fib(n-1) + Fib(n-2)
}
