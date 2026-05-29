// ============================================================
// 知识点：函数定义
//
// Go 函数使用 func 关键字声明。
// 支持多返回值、命名返回值、可变参数、闭包等特性。
// ============================================================

package main

import "fmt"

// ---- 1. 基本函数定义 ----
// 参数类型写在变量名后面（Go 风格）
func add(a int, b int) int {
	return a + b
}

// 连续相同类型可以省略前面的类型声明
func multiply(a, b int) int {
	return a * b
}

// ---- 2. 多返回值 ----
func divide(a, b int) (int, error) {
	if b == 0 {
		return 0, fmt.Errorf("除数不能为零")
	}
	return a / b, nil
}

// ---- 3. 命名返回值 ----
// 返回值预先命名，函数体直接给变量赋值，自动 return
func rectangleInfo(width, height float64) (area, perimeter float64) {
	area = width * height
	perimeter = 2 * (width + height)
	return // 裸返回（naked return），返回 area, perimeter
}

// ---- 4. 可变参数（variadic） ----
// ... 表示可变参数，在函数内作为 slice 使用
func sum(numbers ...int) int {
	total := 0
	for _, n := range numbers {
		total += n
	}
	return total
}

// 可变参数可以和其他参数混合（可变参数必须在最后）
func greetWithNames(greeting string, names ...string) {
	for _, name := range names {
		fmt.Printf("%s, %s!\n", greeting, name)
	}
}

// ---- 5. 函数作为值 ----
func applyOperation(a, b int, op func(int, int) int) int {
	return op(a, b)
}

func main() {
	// 调用基本函数
	fmt.Printf("add(3, 5) = %d\n", add(3, 5))
	fmt.Printf("multiply(4, 6) = %d\n", multiply(4, 6))

	// 多返回值 + 错误检查
	result, err := divide(10, 3)
	if err != nil {
		fmt.Println("错误:", err)
	} else {
		fmt.Printf("divide(10, 3) = %d\n", result)
	}

	// 测试除零错误
	_, err = divide(5, 0)
	if err != nil {
		fmt.Println("预期错误:", err)
	}

	// 命名返回值
	area, perim := rectangleInfo(3.5, 4.0)
	fmt.Printf("矩形(3.5×4.0) 面积=%.2f, 周长=%.2f\n", area, perim)

	// 可变参数
	fmt.Printf("sum(1,2,3) = %d\n", sum(1, 2, 3))
	fmt.Printf("sum(1,2,3,4,5) = %d\n", sum(1, 2, 3, 4, 5))

	// 展开 slice 传递给可变参数
	nums := []int{10, 20, 30}
	fmt.Printf("sum(nums...) = %d\n", sum(nums...))

	greetWithNames("你好", "Alice", "Bob", "Charlie")

	// 函数作为值传递
	double := func(a, b int) int { return (a + b) * 2 }
	fmt.Printf("applyOperation(3,5, double) = %d\n", applyOperation(3, 5, double))
}

// 编译运行：go run 01_functions.go
