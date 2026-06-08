// ============================================================
// 知识点：泛型（Generics）— Go 1.18+ 核心特性
//
// 泛型允许编写适用于多种类型的函数和类型。
// 使用类型参数（Type Parameters）和约束（Constraints）。
// 预定义约束：any（任意类型）、comparable（可比较类型）。
// 自定义约束使用 interface 定义。
// ============================================================

package main

import (
	"fmt"
	"sort"
)

// ---- 1. 泛型函数 ----

// 返回两个数中的最小值
// 类型约束：T 必须是 Order 接口（支持 < <= > >= 的类型）
type Ordered interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~uintptr |
		~float32 | ~float64 |
		~string
}

/*
Go 内置约束的分级
约束		支持的运算符		典型用途
any			无任何约束			存储任意类型
comparable	==、!=				map key、查找
自定义 Ordered	<、<=、>、>=	排序、比大小
*/
func Min[T Ordered](a, b T) T {
	if a < b {
		return a
	}
	return b
}

// 泛型函数：反转 slice
func Reverse[T any](s []T) []T {
	result := make([]T, len(s))
	for i, v := range s {
		result[len(s)-1-i] = v
	}
	return result
}

// 泛型函数：查找元素在 slice 中的位置
func IndexOf[T comparable](s []T, target T) int {
	for i, v := range s {
		if v == target {
			return i
		}
	}
	return -1
}

// ---- 2. 泛型类型 ----

// Stack 是一个泛型栈
type Stack[T any] struct {
	elements []T
}

func (s *Stack[T]) Push(v T) {
	s.elements = append(s.elements, v)
}

func (s *Stack[T]) Pop() (T, bool) {
	if len(s.elements) == 0 {
		var zero T
		return zero, false
	}
	v := s.elements[len(s.elements)-1]
	s.elements = s.elements[:len(s.elements)-1]
	return v, true
}

func (s *Stack[T]) Peek() (T, bool) {
	if len(s.elements) == 0 {
		var zero T
		return zero, false
	}
	return s.elements[len(s.elements)-1], true
}

func (s *Stack[T]) Len() int { return len(s.elements) }

// ---- 3. 泛型 slice 操作 ----

// Filter 过滤 slice（保留满足条件的元素）
func Filter[T any](s []T, fn func(T) bool) []T {
	var result []T
	for _, v := range s {
		if fn(v) {
			result = append(result, v)
		}
	}
	return result
}

// Map 转换 slice 元素
func Map[T, U any](s []T, fn func(T) U) []U {
	result := make([]U, len(s))
	for i, v := range s {
		result[i] = fn(v)
	}
	return result
}

// ---- 4. 泛型约束的高级用法 ----
type Number interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
		~float32 | ~float64
}

// Sum 计算数值 slice 的和
func Sum[T Number](s []T) T {
	var total T
	for _, v := range s {
		total += v
	}
	return total
}

// sortSlice 是按 Ordered 约束排序的泛型函数
// 注意：Go 不支持泛型闭包（匿名函数），泛型函数必须定义为包级函数
func sortSlice[T Ordered](s []T) {
	sort.Slice(s, func(i, j int) bool {
		return s[i] < s[j]
	})
}

func main() {
	// ---- 1. 泛型函数调用 ----
	fmt.Println("--- 泛型函数 ---")

	// 显式指定类型参数
	fmt.Println("Min[int](10, 20):", Min[int](10, 20))
	// 类型推断（多数情况可以省略类型参数）
	fmt.Println("Min(10, 20):", Min(10, 20))
	fmt.Println("Min(3.14, 2.72):", Min(3.14, 2.72))
	fmt.Println("Min('a', 'b'):", Min("apple", "banana"))

	// ---- 2. 泛型 slice 操作 ----
	fmt.Println("\n--- 泛型 slice 操作 ---")

	nums := []int{1, 2, 3, 4, 5}
	fmt.Println("Reversed:", Reverse(nums))

	words := []string{"a", "b", "c", "d"}
	fmt.Println("Reversed:", Reverse(words))

	fmt.Println("IndexOf(nums, 3):", IndexOf(nums, 3))
	fmt.Println("IndexOf(nums, 10):", IndexOf(nums, 10))

	// ---- 3. 泛型类型 ----
	fmt.Println("\n--- 泛型栈 ---")
	intStack := Stack[int]{}
	intStack.Push(10)
	intStack.Push(20)
	intStack.Push(30)
	fmt.Printf("栈大小: %d\n", intStack.Len())

	if v, ok := intStack.Peek(); ok {
		fmt.Println("栈顶:", v)
	}
	for v, ok := intStack.Pop(); ok; v, ok = intStack.Pop() {
		fmt.Printf("  弹出: %d\n", v)
	}

	// 字符串栈
	strStack := Stack[string]{}
	strStack.Push("Hello")
	strStack.Push("World")
	fmt.Printf("字符串栈大小: %d\n", strStack.Len())

	// ---- 4. Filter 和 Map ----
	fmt.Println("\n--- Filter 和 Map ---")

	numbers := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
	evenNumbers := Filter(numbers, func(n int) bool { return n%2 == 0 })
	fmt.Println("偶数:", evenNumbers)

	doubled := Map(numbers, func(n int) int { return n * 2 })
	fmt.Println("翻倍:", doubled)

	strNumbers := Map(numbers, func(n int) string {
		return fmt.Sprintf("Num:%d", n)
	})
	fmt.Println("转字符串:", strNumbers)

	// ---- 5. Sum 泛型 ----
	fmt.Println("\n--- Sum ---")
	fmt.Println("Sum(nums):", Sum([]int{1, 2, 3, 4, 5}))
	fmt.Println("Sum(floats):", Sum([]float64{1.1, 2.2, 3.3}))

	// ---- 6. 在 sort 中使用泛型 ----
	fmt.Println("\n--- 泛型与排序 ---")

	unsorted := []int{3, 1, 4, 1, 5, 9, 2, 6}
	sortSlice(unsorted)
	fmt.Println("排序后:", unsorted)

	// 字符串排序
	names := []string{"Charlie", "Alice", "Bob"}
	sortSlice(names)
	fmt.Println("排序后:", names)
}

// ---- 编译方法 ----
// 泛型需要 Go 1.18+
// go run 05_generics.go

// ---- 附：~ 符号含义 ----
// Ordered 中使用的 ~int 表示"底层类型为 int 的类型"都满足约束
// 例如： type MyInt int 也满足 ~int 约束
// 如果写 int 则只有 int 满足，MyInt 不满足
