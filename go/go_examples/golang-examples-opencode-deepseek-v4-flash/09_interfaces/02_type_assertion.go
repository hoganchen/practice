// ============================================================
// 知识点：空接口与类型断言
//
// 空接口 interface{} 没有任何方法，可表示任意类型的值。
// 类型断言用于从接口值中提取具体类型的值。
// 类型 switch 可以根据接口值的实际类型进行分支。
//
// 编译运行方法：
//   go run 02_type_assertion.go
// ============================================================

package main

import "fmt"

// -------- 空接口示例：可接受任何类型的函数 --------
func describe(i interface{}) {
	fmt.Printf("(值: %v, 类型: %T)\n", i, i)
}

// -------- 类型断言 --------
func getValue(i interface{}) {
	// 语法：v, ok := i.(Type)
	// ok 为 true 时断言成功，否则失败（不会 panic）
	if value, ok := i.(int); ok {
		fmt.Println("这是一个整数:", value)
	} else if value, ok := i.(string); ok {
		fmt.Println("这是一个字符串:", value)
	} else if value, ok := i.(float64); ok {
		fmt.Println("这是一个浮点数:", value)
	} else {
		fmt.Println("未知类型:", i)
	}
}

// -------- 类型 switch --------
func classify(i interface{}) {
	switch v := i.(type) {
	case int:
		fmt.Printf("整数 %d (平方: %d)\n", v, v*v)
	case string:
		fmt.Printf("字符串 %q (长度: %d)\n", v, len(v))
	case float64:
		fmt.Printf("浮点数 %.2f\n", v)
	case bool:
		fmt.Printf("布尔值 %v\n", v)
	case []int:
		fmt.Printf("整数切片 %v (元素数: %d)\n", v, len(v))
	default:
		fmt.Printf("未知类型: %T, 值: %v\n", v, v)
	}
}

func main() {
	// -------- 空接口可存放任何值 --------
	fmt.Println("=== 空接口 ===")
	describe(42)
	describe("hello")
	describe(3.14)
	describe(true)
	describe([]int{1, 2, 3})

	// -------- 类型断言 --------
	fmt.Println("\n=== 类型断言 ===")
	getValue(123)
	getValue("hello")
	getValue(3.14)

	// -------- 类型 switch --------
	fmt.Println("\n=== 类型 switch ===")
	classify(42)
	classify("Go语言")
	classify(3.14159)
	classify(true)
	classify([]int{10, 20, 30})
	classify(map[string]int{"a": 1})
}
