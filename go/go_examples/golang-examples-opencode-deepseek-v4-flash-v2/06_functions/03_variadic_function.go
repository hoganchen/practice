// ============================================================================
// 知识点: 可变参数函数
//
// 说明:
// - 可变参数使用 ...类型 语法, 在函数内部作为切片使用
// - 可变参数必须是最后一个参数
// - 调用时, 可以将切片展开传入: func(slice...)
// - fmt.Println 就是典型的可变参数函数
//
// 编译和运行:
//   go run 06_functions\03_variadic_function.go
// ============================================================================

package main

import "fmt"

// 可变参数求和
func sum(values ...int) int {
	total := 0
	for _, v := range values {
		total += v
	}
	return total
}

// 可变参数 + 固定参数
func greet(prefix string, names ...string) {
	for _, name := range names {
		fmt.Printf("%s %s\n", prefix, name)
	}
}

func main() {
	fmt.Println("sum():", sum())
	fmt.Println("sum(1, 2, 3):", sum(1, 2, 3))
	fmt.Println("sum(10, 20, 30, 40, 50):", sum(10, 20, 30, 40, 50))

	greet("你好", "Alice", "Bob", "Charlie")

	// 展开切片
	nums := []int{5, 10, 15}
	fmt.Println("展开切片:", sum(nums...))
}
