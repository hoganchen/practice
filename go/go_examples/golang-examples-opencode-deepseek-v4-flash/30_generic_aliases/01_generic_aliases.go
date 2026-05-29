// ============================================================
// 知识点：泛型类型别名（Generic Type Aliases，Go 1.24+）
//
// 在 Go 1.24 之前，类型别名不能带类型参数。
// Go 1.24 完全支持泛型类型别名，即：
//   type Alias[T any] = Original[T]
//
// 泛型类型别名的用途：
//   1. 为泛型类型创建简短的别名
//   2. 在重构时保持向后兼容
//   3. 为泛型类型添加文档友好的名字
//
// 编译运行方法：
//   go run 01_generic_aliases.go
// ============================================================

package main

import (
	"fmt"
)

// -------- 原始泛型类型 --------
type Pair[T, U any] struct {
	First  T
	Second U
}

func (p Pair[T, U]) String() string {
	return fmt.Sprintf("(%v, %v)", p.First, p.Second)
}

// -------- 泛型类型别名 --------
// PairInt 是 Pair[int, int] 的别名
type PairInt = Pair[int, int]

// PairStrInt 是 Pair[string, int] 的别名
type PairStrInt = Pair[string, int]

// -------- 泛型函数 + 别名 --------
type Vector[T any] []T

// VecInt 是 Vector[int] 的别名
type VecInt = Vector[int]

func PrintVec[T any](v Vector[T]) {
	for i, x := range v {
		if i > 0 {
			fmt.Print(", ")
		}
		fmt.Print(x)
	}
	fmt.Println()
}

func main() {
	// -------- 通过别名使用泛型类型（不需指定类型参数）--------
	fmt.Println("=== 泛型类型别名 ===")
	p1 := PairInt{First: 10, Second: 20}
	p2 := PairStrInt{First: "hello", Second: 42}
	fmt.Println("PairInt:", p1)
	fmt.Println("PairStrInt:", p2)

	// -------- 在切片中使用别名 --------
	fmt.Println("\n=== 切片与别名 ===")
	points := []PairInt{
		{1, 2},
		{3, 4},
		{5, 6},
	}
	fmt.Println("points:", points)

	// -------- 泛型容器别名 --------
	fmt.Println("\n=== Vector 别名 ===")
	vi := VecInt{1, 2, 3, 4, 5}
	PrintVec(vi)

	// -------- 别名与原类型等价 --------
	fmt.Println("\n=== 类型等价性 ===")
	var a PairInt
	var b Pair[int, int]
	a = b // 编译通过：PairInt 就是 Pair[int, int]
	b = a
	fmt.Println("PairInt 与 Pair[int,int] 完全等价:", a, b)
}
