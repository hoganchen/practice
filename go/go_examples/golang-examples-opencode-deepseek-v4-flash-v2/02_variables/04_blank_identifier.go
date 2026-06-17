// ============================================================================
// 知识点: 空标识符 (Blank Identifier) _
//
// 说明:
// - _ (下划线) 是 Go 中的空标识符, 用于忽略不需要的值
// - 任何值都可以赋给 _, 但 _ 不可被引用
// - 常见用途: 忽略函数返回值、忽略 range 索引、强制类型检查
// - 用于 import 但不需要直接使用的包 (驱动注册)
// - 用于声明但未使用的变量 (如接口实现检查)
//
// 编译和运行:
//   go run 02_variables\04_blank_identifier.go
// ============================================================================

package main

import (
	"fmt"
	"strconv"
)

func main() {
	// 忽略函数返回值
	result, _ := strconv.Atoi("42")
	fmt.Println("解析结果:", result)

	// 忽略 range 索引
	items := []string{"a", "b", "c"}
	for _, item := range items {
		fmt.Print(" ", item)
	}
	fmt.Println()

	// 忽略 map 的 value
	m := map[string]int{"x": 1, "y": 2}
	for key := range m {
		fmt.Println("key:", key)
	}

	// 忽略 map key 是否存在
	if _, exists := m["z"]; !exists {
		fmt.Println("key 'z' 不存在")
	}

	// 编译期接口实现检查
	var _ fmt.Stringer = (*MyType)(nil)
	fmt.Println("接口实现检查通过")
}

type MyType struct{}

func (m MyType) String() string { return "MyType" }
