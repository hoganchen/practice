// ============================================================
// 知识点：cmp 包 — 有序类型比较（Go 1.21+）
//
// cmp 包提供了比较有序类型（Ordered）的泛型函数。
// 核心函数：
//   cmp.Compare[T Ordered](x, y T) int
//     — 比较 x 和 y：x < y 返回 -1，x == y 返回 0，x > y 返回 1
//   cmp.Less(x, y T) bool
//     — 等价于 x < y
//   cmp.Or[T comparable](vals ...T) T
//     — 返回第一个非零值的参数（Go 1.22+）
//
// cmp.Ordered 约束：~int | ~int8 | ... | ~float64 | ~string
//
// 编译运行方法：
//   go run 01_cmp.go
// ============================================================

package main

import (
	"cmp"
	"fmt"
	"sort"
)

func main() {
	// -------- cmp.Compare --------
	fmt.Println("=== cmp.Compare ===")
	fmt.Printf("Compare(3, 5) = %d (3 < 5)\n", cmp.Compare(3, 5))
	fmt.Printf("Compare(5, 3) = %d (5 > 3)\n", cmp.Compare(5, 3))
	fmt.Printf("Compare(4, 4) = %d (4 == 4)\n", cmp.Compare(4, 4))
	fmt.Printf("Compare(3.14, 2.71) = %d\n", cmp.Compare(3.14, 2.71))
	fmt.Printf("Compare(\"a\", \"b\") = %d\n", cmp.Compare("a", "b"))

	// -------- cmp.Less --------
	fmt.Println("\n=== cmp.Less ===")
	fmt.Println("Less(3, 5):", cmp.Less(3, 5))
	fmt.Println("Less(5, 3):", cmp.Less(5, 3))

	// -------- cmp.Or（Go 1.22+）--------
	fmt.Println("\n=== cmp.Or 返回第一个非零值 ===")
	fmt.Println("Or(0, 0, 5, 10):", cmp.Or(0, 0, 5, 10))       // 5
	fmt.Println("Or(\"\", \"default\"):", cmp.Or("", "default"))   // "default"
	fmt.Println("Or(\"first\", \"second\"):", cmp.Or("first", "second")) // "first"

	// 实际应用：默认值
	userInput := ""
	name := cmp.Or(userInput, "匿名用户")
	fmt.Println("用户名:", name)

	// -------- 在 sort 中使用 cmp.Compare --------
	fmt.Println("\n=== sort + cmp.Compare ===")
	people := []struct {
		Name string
		Age  int
	}{
		{"张三", 30},
		{"李四", 25},
		{"王五", 35},
		{"赵六", 25},
	}

	// 先按年龄排序，年龄相同按名字排序
	sort.Slice(people, func(i, j int) bool {
		return cmp.Or(
			cmp.Compare(people[i].Age, people[j].Age),
			cmp.Compare(people[i].Name, people[j].Name),
		) < 0
	})
	for _, p := range people {
		fmt.Printf("  %s: %d岁\n", p.Name, p.Age)
	}

	// -------- 泛型函数中使用 cmp.Ordered --------
	fmt.Println("\nClamp 示例（使用 cmp.Ordered 约束）:")
	fmt.Println("Clamp(5, 1, 10) =", Clamp(5, 1, 10))
	fmt.Println("Clamp(0, 1, 10) =", Clamp(0, 1, 10))
	fmt.Println("Clamp(20, 1, 10) =", Clamp(20, 1, 10))
}

// Clamp 将值限制在 [low, high] 范围内
func Clamp[T cmp.Ordered](val, low, high T) T {
	if cmp.Less(val, low) {
		return low
	}
	if cmp.Less(high, val) {
		return high
	}
	return val
}
