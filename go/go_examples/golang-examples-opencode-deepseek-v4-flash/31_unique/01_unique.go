// ============================================================
// 知识点：unique 包 — 值规范化 / 驻留（Go 1.23+）
//
// unique 包提供值规范化（canonicalization / interning）功能。
// 核心函数：
//   unique.Make[T](v T) Handle[T]
//     — 返回一个代表规范化值的 Handle[T]
//
// 当两个相等的值通过 Make 规范化后，它们的 Handle 是相同的（指针相等）。
// 这可以显著减少重复值的内存占用，并让比较操作退化为指针比较。
//
// 编译运行方法：
//   go run 01_unique.go
// ============================================================

package main

import (
	"fmt"
	"unique"
)

func main() {
	// -------- 基本用法：字符串驻留 --------
	fmt.Println("=== 基本用法 ===")
	// 正常情况下，相同的字符串字面量可能指向不同内存
	s1 := "hello"
	s2 := "hello"
	fmt.Println("普通字符串相等:", s1 == s2) // true

	// 使用 unique.Make 创建 Handle
	h1 := unique.Make(s1)
	h2 := unique.Make(s2)
	// Handle 可以直接比较（指针比较，非常快）
	fmt.Println("h1 == h2:", h1 == h2) // true

	// 从 Handle 取回原始值
	fmt.Println("h1.Value():", h1.Value())

	// -------- 减少内存占用 --------
	fmt.Println("\n=== 内存优化演示 ===")
	names := []string{
		"张三", "李四", "王五",
		"张三", "张三", "李四",
	}
	// 使用 Make 驻留后，重复的字符串共享同一份内存
	handles := make([]unique.Handle[string], len(names))
	for i, name := range names {
		handles[i] = unique.Make(name)
	}

	// 检查哪些是重复的
	uniqueCount := 0
	seen := make(map[unique.Handle[string]]bool)
	for _, h := range handles {
		if !seen[h] {
			seen[h] = true
			uniqueCount++
		}
	}
	fmt.Printf("总共 %d 个名字，仅有 %d 个唯一值（驻留后共享内存）\n",
		len(names), uniqueCount)

	// -------- Handle 比较非常快 --------
	fmt.Println("\n=== Handle 比较 ===")
	a := unique.Make("very long string value")
	b := unique.Make("very long string value")
	c := unique.Make("different value")

	fmt.Println("a == b:", a == b) // true
	fmt.Println("a == c:", a == c) // false
}
