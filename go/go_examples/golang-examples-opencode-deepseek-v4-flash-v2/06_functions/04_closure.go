// ============================================================================
// 知识点: 闭包 (Closure)
//
// 说明:
// - 闭包是一个函数值, 它引用了其外部作用域的变量
// - 闭包会"捕获"并持有外部变量的引用, 即使外部函数已返回
// - 常用于: 状态保持、回调函数、工厂函数
// - 注意闭包捕获的是变量引用而非值(可能导致意外行为)
//
// 编译和运行:
//   go run 06_functions\04_closure.go
// ============================================================================

package main

import "fmt"

// 闭包: 累加器
func accumulator() func(int) int {
	sum := 0
	return func(x int) int {
		sum += x
		return sum
	}
}

// 闭包陷阱示例
func closureTrap() []func() {
	var funcs []func()
	for i := 0; i < 3; i++ {
		funcs = append(funcs, func() {
			fmt.Println(i) // 捕获的是变量 i 的引用
		})
	}
	return funcs
}

func main() {
	// 累加器
	acc := accumulator()
	fmt.Println("acc(10):", acc(10))
	fmt.Println("acc(20):", acc(20))
	fmt.Println("acc(30):", acc(30))

	// 每个闭包独立持有状态
	acc2 := accumulator()
	fmt.Println("acc2(5):", acc2(5))

	// 闭包陷阱: 所有函数打印相同的值
	funcs := closureTrap()
	for _, f := range funcs {
		f() // 预期 0, 1, 2, 实际输出 3, 3, 3
	}

	// 修正: 每次迭代创建新变量
	var funcs2 []func()
	for i := 0; i < 3; i++ {
		i := i // 创建副本
		funcs2 = append(funcs2, func() {
			fmt.Println(i)
		})
	}
	fmt.Println("修正后:")
	for _, f := range funcs2 {
		f()
	}
}
