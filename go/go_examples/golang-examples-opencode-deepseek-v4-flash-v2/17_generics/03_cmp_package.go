// ============================================================================
// 知识点: cmp 包 - 有序类型比较 (Go 1.21+)
//
// 说明:
// - cmp 包提供泛型有序类型比较函数
// - cmp.Compare[T ~int | ~float64 | ~string](a, b T) int
// - cmp.Less[T ~int | ~float64 | ~string](a, b T) bool
// - 返回 -1 (a<b), 0 (a==b), 1 (a>b)
// - 常用于泛型代码中需要排序或比较的场景
// - 支持所有有序类型 (整数、浮点数、字符串)
//
// 编译和运行:
//   go run 17_generics\03_cmp_package.go
// ============================================================================

package main

import (
	"cmp"
	"fmt"
	"slices"
)

// 使用 cmp 实现泛型最大值函数
func Max[T cmp.Ordered](a, b T) T {
	if cmp.Less(a, b) {
		return b
	}
	return a
}

// 使用 cmp 实现泛型排序
func SortDesc[T cmp.Ordered](s []T) {
	slices.SortFunc(s, func(a, b T) int {
		return cmp.Compare(b, a) // 降序
	})
}

func main() {
	fmt.Println("cmp.Compare:")
	fmt.Printf("  Compare(1, 2) = %d\n", cmp.Compare(1, 2))
	fmt.Printf("  Compare(5, 5) = %d\n", cmp.Compare(5, 5))
	fmt.Printf("  Compare(9, 3) = %d\n", cmp.Compare(9, 3))

	fmt.Println("\ncmp.Less:")
	fmt.Printf("  Less(1, 2) = %t\n", cmp.Less(1, 2))

	fmt.Println("\n泛型 Max 函数:")
	fmt.Printf("  Max(10, 20) = %d\n", Max(10, 20))
	fmt.Printf("  Max(3.14, 2.72) = %.2f\n", Max(3.14, 2.72))
	fmt.Printf("  Max(\"apple\", \"banana\") = %s\n", Max("apple", "banana"))

	fmt.Println("\n泛型降序排序:")
	nums := []int{3, 1, 4, 1, 5, 9, 2, 6}
	SortDesc(nums)
	fmt.Printf("  %v\n", nums)

	strs := []string{"banana", "apple", "cherry", "date"}
	SortDesc(strs)
	fmt.Printf("  %v\n", strs)
}
