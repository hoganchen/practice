// ============================================================================
// 知识点: 多返回值
//
// 说明:
// - Go函数支持返回多个值, 这是Go的一个重要特性
// - 常见的用法是一个返回值 + 一个错误值
// - 使用 _ (下划线) 忽略不需要的返回值
//
// 编译和运行:
//   go run 06_functions\02_multiple_return.go
// ============================================================================

package main

import (
	"errors"
	"fmt"
)

// 多返回值: 结果 + 错误
func safeDivide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, errors.New("除数不能为零")
	}
	return a / b, nil
}

// 返回两个计算结果
func swapAndSum(a, b int) (int, int, int) {
	return b, a, a + b
}

func main() {
	// 处理错误返回值
	result, err := safeDivide(10, 2)
	if err != nil {
		fmt.Println("错误:", err)
	} else {
		fmt.Println("10/2 =", result)
	}

	// 除零错误
	result, err = safeDivide(10, 0)
	if err != nil {
		fmt.Println("错误:", err)
	}

	// 多返回值
	x, y, sum := swapAndSum(3, 7)
	fmt.Printf("swapAndSum(3, 7): x=%d, y=%d, sum=%d\n", x, y, sum)

	// 使用 _ 忽略返回值
	a, _, _ := swapAndSum(1, 2)
	fmt.Println("只取第一个返回值:", a)
}
