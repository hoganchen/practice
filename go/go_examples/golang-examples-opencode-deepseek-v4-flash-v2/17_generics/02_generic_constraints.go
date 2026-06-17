// ============================================================================
// 知识点: 泛型约束 (Constraint)
//
// 说明:
// - 约束限制类型参数可以使用的类型
// - 内置约束: any, comparable
// - 自定义约束: interface { ~int | ~float64 } (类型集合)
// - ~ 表示允许底层类型为指定类型的类型
// - constraints 包已废弃, 使用内置 comparable 或自定义约束
//
// 编译和运行:
//   go run 17_generics\02_generic_constraints.go
// ============================================================================

package main

import "fmt"

// 数值类型约束 (Go 1.18+ 类型集合语法)
type Number interface {
	~int | ~int64 | ~float64
}

// 可排序约束
type Ordered interface {
	~int | ~int64 | ~float64 | ~string
}

// 泛型函数: 数字相加
func Sum[T Number](values []T) T {
	var total T
	for _, v := range values {
		total += v
	}
	return total
}

// 泛型函数: 获取最大值
func Max[T Ordered](a, b T) T {
	if a > b {
		return a
	}
	return b
}

// 自定义类型的底层类型匹配
type Celsius float64

func main() {
	// Number 约束
	fmt.Println("Sum(int):", Sum([]int{1, 2, 3, 4, 5}))
	fmt.Println("Sum(float64):", Sum([]float64{1.5, 2.5, 3.5}))

	// Ordered 约束
	fmt.Println("Max(int):", Max(10, 20))
	fmt.Println("Max(string):", Max("apple", "banana"))

	// ~float64 匹配 Celsius 类型
	temps := []Celsius{36.5, 37.0, 38.2}
	fmt.Println("Sum(Celsius):", Sum(temps))
}
