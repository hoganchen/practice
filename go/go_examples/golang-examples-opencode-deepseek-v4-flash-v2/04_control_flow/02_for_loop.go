// ============================================================================
// 知识点: for 循环
//
// 说明:
// - Go只有一种循环关键字: for, 但支持多种形式
// - 标准 for 循环: for 初始化; 条件; 后置 {}
// - 类似while的写法: for 条件 {}
// - 无限循环: for {}
// - range 子句用于遍历数组、切片、字符串、map、通道
// - 使用 break 跳出循环, continue 跳过本次循环
//
// 编译和运行:
//   go run 04_control_flow\02_for_loop.go
// ============================================================================

package main

import "fmt"

func main() {
	// 标准 for 循环
	fmt.Println("标准 for 循环:")
	for i := 0; i < 5; i++ {
		fmt.Printf("  %d ", i)
	}
	fmt.Println()

	// 类似 while 循环
	fmt.Println("类似 while 循环:")
	n := 0
	for n < 3 {
		fmt.Printf("  %d ", n)
		n++
	}
	fmt.Println()

	// 使用 range 遍历切片
	fmt.Println("range 遍历:")
	fruits := []string{"苹果", "香蕉", "橙子"}
	for index, value := range fruits {
		fmt.Printf("  索引 %d: %s\n", index, value)
	}

	// 使用 range 遍历 map
	fmt.Println("range 遍历 map:")
	ages := map[string]int{"Alice": 30, "Bob": 25, "Charlie": 35}
	for name, age := range ages {
		fmt.Printf("  %s: %d岁\n", name, age)
	}
}
