// ============================================================================
// 知识点: 空接口 (interface{}) / any
//
// 说明:
// - 空接口 interface{} (Go 1.18+ 可用 any 作为别名) 表示任何类型
// - 所有类型都实现了空接口, 类似 Java 的 Object
// - 从 Go 1.18 起, 推荐使用泛型代替空接口实现通用代码
// - 使用类型断言将空接口还原为具体类型
// - fmt.Println, json.Marshal 等函数参数使用空接口
//
// 编译和运行:
//   go run 09_interfaces\02_empty_interface.go
// ============================================================================

package main

import "fmt"

// 使用 any (interface{} 的别名)
func printValue(v any) {
	fmt.Printf("值: %v, 类型: %T\n", v, v)
}

func main() {
	printValue(42)
	printValue(3.14)
	printValue("Hello")
	printValue([]int{1, 2, 3})
	printValue(map[string]int{"a": 1})

	// any 切片
	items := []any{100, "text", true, 3.14}
	fmt.Println("混合类型切片:")
	for _, item := range items {
		printValue(item)
	}
}
