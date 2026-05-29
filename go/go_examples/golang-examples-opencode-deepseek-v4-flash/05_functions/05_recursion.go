// ============================================================
// 知识点：递归（Recursion）
//
// Go 支持递归函数，即函数调用自身。
// 递归需要有一个或多个终止条件（base case），
// 否则会导致无限递归和栈溢出。
//
// 编译运行方法：
//   go run 05_recursion.go
// ============================================================

package main

import "fmt"

// -------- 计算阶乘 n! --------
// n! = n * (n-1) * ... * 1, 0! = 1
func factorial(n uint) uint {
	if n <= 1 { // 终止条件
		return 1
	}
	return n * factorial(n-1) // 递归调用
}

// -------- 斐波那契数列 --------
// fib(n) = fib(n-1) + fib(n-2), fib(0) = 0, fib(1) = 1
func fibonacci(n int) int {
	if n <= 1 {
		return n
	}
	return fibonacci(n-1) + fibonacci(n-2)
}

// -------- 尾递归优化版本：计算斐波那契 --------
func fibonacciTail(n int) int {
	var helper func(n, a, b int) int
	helper = func(n, a, b int) int {
		if n == 0 {
			return a
		}
		return helper(n-1, b, a+b)
	}
	return helper(n, 0, 1)
}

func main() {
	// 阶乘
	fmt.Println("=== 阶乘 ===")
	for i := uint(0); i <= 10; i++ {
		fmt.Printf("%d! = %d\n", i, factorial(i))
	}

	// 斐波那契
	fmt.Println("\n=== 斐波那契数列 ===")
	for i := 0; i <= 10; i++ {
		fmt.Printf("fib(%d) = %d\n", i, fibonacci(i))
	}

	// 尾递归
	fmt.Println("\n=== 尾递归斐波那契 ===")
	for i := 0; i <= 10; i++ {
		fmt.Printf("fib_tail(%d) = %d\n", i, fibonacciTail(i))
	}
}
