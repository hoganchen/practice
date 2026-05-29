// ============================================================
// 知识点：泛型（Generics，Go 1.18+）
//
// Go 1.18 引入了泛型，允许编写可处理不同类型的代码。
// 核心概念：
//   类型参数 [T any] — T 是一个类型参数
//   类型约束（interface）— 限定 T 必须满足的条件
//   约束语法：[T 约束名]
//
// 编译运行方法：
//   go run 01_generics.go
//
// 注意：需要 Go 1.18 及以上版本
// ============================================================

package main

import (
	"cmp"
	"fmt"
)

// -------- 泛型函数：最小值 --------
func Min[T cmp.Ordered](a, b T) T {
	if a < b {
		return a
	}
	return b
}

// -------- 泛型函数：最大值 --------
func Max[T cmp.Ordered](a, b T) T {
	if a > b {
		return a
	}
	return b
}

// -------- 泛型栈 --------
type Stack[T any] struct {
	items []T
}

func (s *Stack[T]) Push(item T) {
	s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() (T, bool) {
	if len(s.items) == 0 {
		var zero T
		return zero, false
	}
	item := s.items[len(s.items)-1]
	s.items = s.items[:len(s.items)-1]
	return item, true
}

func (s *Stack[T]) Peek() (T, bool) {
	if len(s.items) == 0 {
		var zero T
		return zero, false
	}
	return s.items[len(s.items)-1], true
}

// -------- 自定义类型约束 --------
type Numeric interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
		~float32 | ~float64
}

// Sum 使用自定义约束
func Sum[T Numeric](values []T) T {
	var total T
	for _, v := range values {
		total += v
	}
	return total
}

func main() {
	// -------- 泛型函数 --------
	fmt.Println("=== 泛型函数 ===")
	fmt.Println("Min(10, 20):", Min(10, 20))
	fmt.Println("Min(3.14, 2.71):", Min(3.14, 2.71))
	fmt.Println("Max(10, 20):", Max(10, 20))
	fmt.Println("Max(3.14, 2.71):", Max(3.14, 2.71))

	// -------- 泛型数据结构 --------
	fmt.Println("\n=== 泛型栈 ===")
	intStack := Stack[int]{}
	intStack.Push(10)
	intStack.Push(20)
	intStack.Push(30)

	if v, ok := intStack.Pop(); ok {
		fmt.Println("弹出:", v) // 30
	}
	if v, ok := intStack.Peek(); ok {
		fmt.Println("栈顶:", v) // 20
	}

	strStack := Stack[string]{}
	strStack.Push("Hello")
	strStack.Push("World")

	if v, ok := strStack.Pop(); ok {
		fmt.Println("弹出:", v) // "World"
	}

	// -------- 自定义约束 --------
	fmt.Println("\n=== 自定义约束 ===")
	ints := []int{1, 2, 3, 4, 5}
	floats := []float64{1.5, 2.5, 3.0}

	fmt.Println("整数求和:", Sum(ints))
	fmt.Println("浮点求和:", Sum(floats))
}
