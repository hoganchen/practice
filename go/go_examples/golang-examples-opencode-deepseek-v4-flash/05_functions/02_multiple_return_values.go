// ============================================================
// 知识点：多返回值
//
// Go 函数支持返回多个值，这是 Go 语言的重要特性。
// 常见的用法是返回 (结果, 错误) 对。
//
// 编译运行方法：
//   go run 02_multiple_return_values.go
// ============================================================

package main

import "fmt"

// -------- 返回两个值 --------
func swap(a, b string) (string, string) {
	return b, a
}

// -------- 返回三个值：商、余数、是否成功 --------
func divideWithRemainder(a, b int) (int, int, bool) {
	if b == 0 {
		return 0, 0, false
	}
	return a / b, a % b, true
}

// -------- 命名多返回值 --------
func stats(numbers []int) (sum int, avg float64, ok bool) {
	if len(numbers) == 0 {
		return 0, 0, false // 没有数据时返回 false
	}
	for _, n := range numbers {
		sum += n
	}
	avg = float64(sum) / float64(len(numbers))
	ok = true
	return // 裸返回
}

func main() {
	// 接收所有返回值
	x, y := swap("hello", "world")
	fmt.Println("swap:", x, y)

	// 使用 _ 忽略不需要的返回值
	q, r, ok := divideWithRemainder(17, 5)
	if ok {
		fmt.Printf("17 / 5 = %d 余 %d\n", q, r)
	}

	// 忽略余数
	q, _, ok = divideWithRemainder(10, 3)
	if ok {
		fmt.Println("10 / 3 =", q)
	}

	// 命名返回值
	s, a, ok := stats([]int{85, 92, 78, 90})
	if ok {
		fmt.Printf("总和=%d, 平均=%.2f\n", s, a)
	}
}
