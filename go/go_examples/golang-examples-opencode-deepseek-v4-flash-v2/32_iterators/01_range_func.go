// ============================================================================
// 知识点: 自定义迭代器 (range over func)
//
// 说明:
// - Go 1.23+ 支持 range over func, 可以用 range 遍历自定义迭代器
// - 迭代器函数类型: func(yield func(K, V) bool)
// - yield 返回 false 时停止迭代
// - 可以创建向前、向后、过滤等自定义迭代器
// - 该特性让自定义容器可以像内置类型一样使用 range
//
// 编译和运行:
//   go run 32_iterators\01_range_func.go
// ============================================================================

package main

import (
	"fmt"
	"iter"
)

// 返回一个迭代器, 从 start 到 end (包含)
func Range(start, end int) iter.Seq[int] {
	return func(yield func(int) bool) {
		for i := start; i <= end; i++ {
			if !yield(i) {
				return
			}
		}
	}
}

// 斐波那契数列迭代器
func Fibonacci(max int) iter.Seq[int] {
	return func(yield func(int) bool) {
		a, b := 0, 1
		for a <= max {
			if !yield(a) {
				return
			}
			a, b = b, a+b
		}
	}
}

// 带索引的键值对迭代器
func Enumerate[T any](s []T) iter.Seq2[int, T] {
	return func(yield func(int, T) bool) {
		for i, v := range s {
			if !yield(i, v) {
				return
			}
		}
	}
}

func main() {
	fmt.Println("Range(1, 10):")
	for v := range Range(1, 10) {
		fmt.Printf("  %d ", v)
	}
	fmt.Println()

	fmt.Println("\nFibonacci(100):")
	for v := range Fibonacci(100) {
		fmt.Printf("  %d ", v)
	}
	fmt.Println()

	fmt.Println("\nEnumerate:")
	fruits := []string{"苹果", "香蕉", "橙子"}
	for i, v := range Enumerate(fruits) {
		fmt.Printf("  %d: %s\n", i, v)
	}
}
