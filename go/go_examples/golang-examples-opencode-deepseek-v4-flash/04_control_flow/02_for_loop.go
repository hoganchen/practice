// ============================================================
// 知识点：for 循环
//
// Go 只有一种循环关键字：for，但支持三种形式：
// 1. 完整 for 循环（类似 C 的 for）
// 2. 条件 for 循环（类似 C 的 while）
// 3. 无限循环（for {}）
// 4. for range 遍历（数组、切片、map、字符串、通道等）
// 5. break/continue 控制循环流程
//
// 编译运行方法：
//   go run 02_for_loop.go
// ============================================================

package main

import "fmt"

func main() {
	// -------- 形式1：完整 for 循环（初始化; 条件; 后置）--------
	fmt.Println("=== 完整 for 循环 ===")
	for i := 0; i < 5; i++ {
		fmt.Printf("i = %d\n", i)
	}

	// -------- 形式2：条件 for 循环（类似 while）--------
	fmt.Println("\n=== 条件 for 循环 ===")
	sum := 1
	for sum < 100 {
		sum += sum
	}
	fmt.Println("sum:", sum)

	// -------- 形式3：无限循环 + break --------
	fmt.Println("\n=== 无限循环 + break ===")
	count := 0
	for {
		count++
		if count >= 3 {
			break // 跳出循环
		}
	}
	fmt.Println("break 后 count:", count)

	// -------- continue：跳过本次循环 --------
	fmt.Println("\n=== continue ===")
	for i := 0; i < 10; i++ {
		if i%2 == 0 {
			continue // 跳过偶数
		}
		fmt.Printf("%d ", i)
	}
	fmt.Println()

	// -------- for range 遍历 --------
	fmt.Println("\n=== for range 遍历切片 ===")
	numbers := []int{10, 20, 30, 40, 50}
	for index, value := range numbers {
		fmt.Printf("numbers[%d] = %d\n", index, value)
	}
	// 省略索引或值
	for _, value := range numbers {
		fmt.Printf("value: %d ", value)
	}
	fmt.Println()

	// -------- Go 1.22+：for range 整数 --------
	fmt.Println("\n=== for range 整数 (Go 1.22+) ===")
	for i := range 5 {
		fmt.Printf("%d ", i) // 输出: 0 1 2 3 4
	}
	fmt.Println()
}
