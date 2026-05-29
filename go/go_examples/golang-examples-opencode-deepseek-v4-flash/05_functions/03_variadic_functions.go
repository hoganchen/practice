// ============================================================
// 知识点：变参函数（Variadic Functions）
//
// 变参函数可以接受可变数量的参数。
// 使用 ...T 表示接受零个或多个 T 类型的参数。
// 变参在函数内部是一个切片。
//
// 编译运行方法：
//   go run 03_variadic_functions.go
// ============================================================

package main

import "fmt"

// -------- 变参函数：求和 --------
// nums 在函数内部是 []int 类型
func sum(nums ...int) int {
	total := 0
	for _, n := range nums {
		total += n
	}
	return total
}

// -------- 变参 + 普通参数 --------
// 变参必须放在参数列表的最后
func greetWithNames(greeting string, names ...string) {
	for _, name := range names {
		fmt.Printf("%s, %s!\n", greeting, name)
	}
}

// -------- 变参可以传入任意类型的值（空接口）--------
func printAny(values ...interface{}) {
	for i, v := range values {
		fmt.Printf("[%d] %v (类型: %T)\n", i, v, v)
	}
}

func main() {
	// 传零个参数
	fmt.Println("sum():", sum())

	// 传多个参数
	fmt.Println("sum(1,2,3):", sum(1, 2, 3))
	fmt.Println("sum(1,2,3,4,5):", sum(1, 2, 3, 4, 5))

	// 变参 + 普通参数
	greetWithNames("你好", "张三", "李四", "王五")

	// 将切片解包传入变参函数
	numbers := []int{10, 20, 30, 40}
	fmt.Println("切片解包:", sum(numbers...)) // 使用 slice... 解包

	// 空接口变参
	printAny(42, "hello", 3.14, true, []int{1, 2, 3})
}
