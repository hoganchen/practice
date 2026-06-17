// ============================================================================
// 知识点: 泛型 (Generics) 基础
//
// 说明:
// - Go 1.18 引入泛型, 类型参数使用方括号声明 [T any]
// - any 是 interface{} 的别名, 表示任意类型
// - 泛型函数: func 函数名[T 约束](参数 T) T
// - 泛型类型: type 类型名[T 约束] struct { ... }
// - 泛型可定义在函数、类型、接口上
//
// 编译和运行:
//   go run 17_generics\01_basic_generics.go
// ============================================================================

package main

import "fmt"

// 泛型函数: 比较两个值是否相等
func IsEqual[T comparable](a, b T) bool {
	return a == b
}

// 泛型函数: 反转切片
func Reverse[T any](s []T) []T {
	result := make([]T, len(s))
	for i, v := range s {
		result[len(s)-1-i] = v
	}
	return result
}

// 泛型类型: 栈
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

func main() {
	// 泛型函数
	fmt.Println("IsEqual(1, 1):", IsEqual(1, 1))
	fmt.Println("IsEqual(\"a\", \"b\"):", IsEqual("a", "b"))
	fmt.Println("Reverse:", Reverse([]int{1, 2, 3, 4, 5}))
	fmt.Println("Reverse:", Reverse([]string{"a", "b", "c"}))

	// 泛型类型
	intStack := Stack[int]{}
	intStack.Push(10)
	intStack.Push(20)
	intStack.Push(30)

	for v, ok := intStack.Pop(); ok; v, ok = intStack.Pop() {
		fmt.Println("出栈:", v)
	}
}
