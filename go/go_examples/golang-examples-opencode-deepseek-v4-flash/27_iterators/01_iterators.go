// ============================================================
// 知识点：迭代器 / range-over-func / iter 包（Go 1.23+）
//
// Go 1.23 引入了对"迭代器函数"的支持：for range 可遍历任意函数。
// 迭代器函数签名：func(yield func(K, V) bool) bool
// iter 包提供了 Seq 和 Seq2 类型定义。
//
// 内置标准库中的迭代器：
//   slices.All, slices.Values, slices.Backward
//   maps.Keys, maps.Values, maps.All
//   strings.Lines 等
//
// 编译运行方法：
//   go run 01_iterators.go
// ============================================================

package main

import (
	"fmt"
	"iter"
	"maps"
	"slices"
)

// -------- 自定义迭代器：从 0 到 n-1 --------
func Count(n int) iter.Seq[int] {
	return func(yield func(int) bool) {
		for i := range n {
			if !yield(i) {
				return // 如果 yield 返回 false，提前终止
			}
		}
	}
}

// -------- 自定义迭代器：二叉树遍历 --------
type Tree[T any] struct {
	Value T
	Left  *Tree[T]
	Right *Tree[T]
}

func (t *Tree[T]) InOrder() iter.Seq[T] {
	return func(yield func(T) bool) {
		t.inOrder(yield)
	}
}

func (t *Tree[T]) inOrder(yield func(T) bool) bool {
	if t == nil {
		return true
	}
	if !t.Left.inOrder(yield) {
		return false
	}
	if !yield(t.Value) {
		return false
	}
	return t.Right.inOrder(yield)
}

func main() {
	// -------- for range 遍历自定义迭代器 --------
	fmt.Println("=== 自定义迭代器 Count ===")
	for v := range Count(5) {
		fmt.Printf("%d ", v)
	}
	fmt.Println()

	// -------- 遍历二叉树 --------
	fmt.Println("\n=== 二叉树中序遍历 ===")
	tree := &Tree[int]{
		Value: 5,
		Left:  &Tree[int]{Value: 2,
			Left:  &Tree[int]{Value: 1},
			Right: &Tree[int]{Value: 3},
		},
		Right: &Tree[int]{Value: 7,
			Left:  &Tree[int]{Value: 6},
			Right: &Tree[int]{Value: 8},
		},
	}
	for v := range tree.InOrder() {
		fmt.Printf("%d ", v)
	}
	fmt.Println()

	// -------- slices 迭代器函数 --------
	fmt.Println("\n=== slices 迭代器 ===")
	nums := []string{"a", "b", "c", "d", "e"}

	fmt.Println("slices.All:")
	for i, v := range slices.All(nums) {
		fmt.Printf("  [%d] %s\n", i, v)
	}

	fmt.Println("slices.Backward (反向):")
	for i, v := range slices.Backward(nums) {
		fmt.Printf("  [%d] %s\n", i, v)
	}

	fmt.Println("slices.Values:")
	for v := range slices.Values(nums) {
		fmt.Printf("  %s ", v)
	}
	fmt.Println()

	// -------- maps 迭代器函数 --------
	fmt.Println("\n=== maps 迭代器 ===")
	m := map[string]int{"a": 1, "b": 2, "c": 3}

	fmt.Println("maps.Keys:")
	for k := range maps.Keys(m) {
		fmt.Printf("  %s ", k)
	}
	fmt.Println()

	fmt.Println("maps.Values:")
	for v := range maps.Values(m) {
		fmt.Printf("  %d ", v)
	}
	fmt.Println()

	// -------- slices.Collect: 从迭代器收集到切片 --------
	fmt.Println("\n=== slices.Collect ===")
	squares := func(yield func(int) bool) {
		for i := 1; i <= 5; i++ {
			if !yield(i * i) {
				return
			}
		}
	}
	result := slices.Collect(squares)
	fmt.Println("Collect结果:", result)

	// -------- 提前终止迭代 --------
	fmt.Println("\n=== 提前终止 ===")
	for v := range Count(100) {
		if v >= 5 {
			break // count 迭代器会感知 break 并停止
		}
		fmt.Printf("%d ", v)
	}
	fmt.Println("(提前终止)")
}
