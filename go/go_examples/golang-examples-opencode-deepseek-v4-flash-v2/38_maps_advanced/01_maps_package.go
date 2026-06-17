// ============================================================================
// 知识点: maps 包 (Go 1.21+)
//
// 说明:
// - maps 包提供泛型 map 操作函数
// - maps.Clone 克隆 map
// - maps.Copy 复制 map
// - maps.DeleteFunc 按条件删除
// - maps.Equal 比较两个 map 是否相等
//
// 编译和运行:
//   go run 38_maps_advanced\01_maps_package.go
// ============================================================================

package main

import (
	"fmt"
	"maps"
)

func main() {
	// 基本 map
	original := map[string]int{
		"a": 1, "b": 2, "c": 3,
	}

	// Clone
	clone := maps.Clone(original)
	fmt.Println("Clone:", clone)

	// Copy
	dst := map[string]int{"x": 100}
	maps.Copy(dst, original)
	fmt.Println("Copy (dst):", dst)

	// Equal
	fmt.Println("Equal(original, clone):", maps.Equal(original, clone))

	// EqualFunc (自定义比较)
	fmt.Println("EqualFunc:", maps.EqualFunc(original, clone, func(v1, v2 int) bool {
		return v1 == v2
	}))

	// DeleteFunc
	m := map[string]int{"a": 1, "b": 2, "c": 3, "d": 4}
	maps.DeleteFunc(m, func(k string, v int) bool {
		return v%2 != 0
	})
	fmt.Println("DeleteFunc (保留偶数):", m)

	// nil map 安全操作
	var nilMap map[string]int
	maps.Copy(nilMap, original) // 不会 panic, 但也不会复制
	fmt.Println("nil map Copy:", nilMap)
}
