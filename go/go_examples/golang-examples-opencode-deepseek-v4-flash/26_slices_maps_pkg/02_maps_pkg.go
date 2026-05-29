// ============================================================
// 知识点：maps 标准包（Go 1.21+）
//
// maps 包提供了泛型 map 操作函数。
// 常用函数：
//   Clone — 浅拷贝 map
//   Copy — 将源 map 所有键值对复制到目标 map
//   DeleteFunc — 删除满足条件的键值对
//   Equal / EqualFunc — 比较两个 map 是否相等
//   Keys — 返回所有键的迭代器（Go 1.23）
//   Values — 返回所有值的迭代器（Go 1.23）
//
// 编译运行方法：
//   go run 02_maps_pkg.go
// ============================================================

package main

import (
	"fmt"
	"maps"
)

func main() {
	// -------- maps.Clone --------
	fmt.Println("=== Clone ===")
	original := map[string]int{"a": 1, "b": 2, "c": 3}
	cloned := maps.Clone(original)
	cloned["a"] = 999
	fmt.Println("original:", original) // 不受影响
	fmt.Println("cloned:", cloned)

	// -------- maps.Copy --------
	fmt.Println("\n=== Copy ===")
	dst := map[string]int{"x": 100}
	src := map[string]int{"y": 200, "z": 300}
	maps.Copy(dst, src) // 将 src 的所有键值对复制到 dst
	fmt.Println("Copy结果:", dst)

	// -------- maps.DeleteFunc --------
	fmt.Println("\n=== DeleteFunc ===")
	scores := map[string]int{
		"张三": 45,
		"李四": 82,
		"王五": 60,
		"赵六": 30,
	}
	fmt.Println("删除前:", scores)
	maps.DeleteFunc(scores, func(k string, v int) bool {
		return v < 60 // 删除不及格的
	})
	fmt.Println("删除后:", scores)

	// -------- maps.Equal --------
	fmt.Println("\n=== Equal ===")
	m1 := map[string]int{"a": 1, "b": 2}
	m2 := map[string]int{"b": 2, "a": 1}
	m3 := map[string]int{"a": 1, "b": 3}
	fmt.Println("Equal(m1, m2):", maps.Equal(m1, m2))
	fmt.Println("Equal(m1, m3):", maps.Equal(m1, m3))
}
