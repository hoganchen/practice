// ============================================================
// 知识点：闭包（Closure）
//
// 闭包是一个函数值，它引用了其函数体之外的变量。
// 闭包可以访问和修改其外部函数的局部变量，
// 即使外部函数已经返回，闭包仍然"记住"这些变量。
//
// 编译运行方法：
//   go run 04_closures.go
// ============================================================

package main

import "fmt"

// -------- 闭包：计数器 --------
// 返回一个闭包，每次调用时计数器递增
func newCounter() func() int {
	count := 0                    // 这个变量被闭包捕获
	return func() int {
		count++                    // 闭包修改外部变量
		return count
	}
}

// -------- 闭包：范围限定 --------
// 创建一个包含特定边界的检查器
func makeInRange(min, max int) func(int) bool {
	return func(x int) bool {
		return x >= min && x <= max
	}
}

func main() {
	// -------- 使用闭包计数器 --------
	fmt.Println("=== 闭包计数器 ===")
	counter1 := newCounter()
	counter2 := newCounter()

	// counter1 和 counter2 各自维护独立的 count
	fmt.Println("counter1:", counter1()) // 1
	fmt.Println("counter1:", counter1()) // 2
	fmt.Println("counter2:", counter2()) // 1 (独立的)
	fmt.Println("counter1:", counter1()) // 3
	fmt.Println("counter2:", counter2()) // 2

	// -------- 闭包作为函数工厂 --------
	fmt.Println("\n=== 范围检查器 ===")
	inSchoolAge := makeInRange(6, 18)
	fmt.Println("5岁是否学龄:", inSchoolAge(5))   // false
	fmt.Println("12岁是否学龄:", inSchoolAge(12)) // true
	fmt.Println("20岁是否学龄:", inSchoolAge(20)) // false
}
