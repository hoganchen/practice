// ============================================================================
// 知识点: 类型断言与类型选择
//
// 说明:
// - 类型断言: x.(T) 用于将接口值转换为具体类型
// - 带检查的类型断言: value, ok := x.(T), ok为false时不会panic
// - 类型选择: switch v := x.(type) 可以按类型分支处理
// - 类型断言对 nil 接口值会失败
//
// 编译和运行:
//   go run 09_interfaces\03_type_assertion.go
// ============================================================================

package main

import "fmt"

func checkType(v any) {
	switch val := v.(type) {
	case int:
		fmt.Printf("整数: %d\n", val)
	case float64:
		fmt.Printf("浮点数: %.2f\n", val)
	case string:
		fmt.Printf("字符串: %q (长度: %d)\n", val, len(val))
	case bool:
		fmt.Printf("布尔值: %v\n", val)
	case []int:
		fmt.Printf("int 切片: %v\n", val)
	default:
		fmt.Printf("未知类型: %T\n", v)
	}
}

func main() {
	// 类型断言 (带检查)
	var val any = "Hello, Go!"
	if s, ok := val.(string); ok {
		fmt.Println("断言成功, 字符串内容:", s)
	} else {
		fmt.Println("断言失败")
	}

	// 错误的类型断言 (不带检查会panic)
	if n, ok := val.(int); ok {
		fmt.Println("整数:", n)
	} else {
		fmt.Println("val 不是 int 类型")
	}

	// 类型选择
	fmt.Println("\n类型选择演示:")
	checkType(42)
	checkType(3.14159)
	checkType("类型选择")
	checkType(true)
	checkType([]int{1, 2, 3})
}
