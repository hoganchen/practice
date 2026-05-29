// ============================================================
// 包：calculator
//
// 这是 15_modules 模块的一个子包，演示 Go 模块的包结构。
// 包的可见性：首字母大写的函数/变量可被外部包访问。
// ============================================================

package calculator

// Add 返回两个整数的和
func Add(a, b int) int {
	return a + b
}

// Subtract 返回两个整数的差
func Subtract(a, b int) int {
	return a - b
}

// Multiply 返回两个整数的积
func Multiply(a, b int) int {
	return a * b
}

// Divide 返回两个整数的商和余数
func Divide(a, b int) (int, int) {
	if b == 0 {
		return 0, 0
	}
	return a / b, a % b
}

// Square 计算平方
func Square(n int) int {
	return n * n
}

// factorial 是私有函数（首字母小写），只能在包内使用
func factorial(n int) int {
	if n <= 1 {
		return 1
	}
	return n * factorial(n-1)
}

// Factorial 计算阶乘（公开函数）
func Factorial(n int) int {
	if n < 0 {
		return -1 // 错误值
	}
	return factorial(n)
}
