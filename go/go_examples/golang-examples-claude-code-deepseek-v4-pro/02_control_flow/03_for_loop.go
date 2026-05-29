// ============================================================
// 知识点：for 循环
//
// Go 只有 for 关键字实现所有循环逻辑（没有 while/do-while）。
// 支持三种形式：经典 for、条件 for（≈while）、无限循环。
// range 子句可以遍历 slice、map、string、channel 等。
// Go 1.22+ 支持 range over int 和每次循环新变量语义。
// ============================================================

package main

import "fmt"

func main() {
	// ---- 1. 经典 for 循环（init; condition; post） ----
	fmt.Println("--- 经典 for 循环 ---")
	for i := 0; i < 5; i++ {
		fmt.Printf("  i = %d\n", i)
	}
	// 输出: 0, 1, 2, 3, 4

	// ---- 2. 条件 for（类似 while） ----
	fmt.Println("--- 条件 for（类似 while）---")
	sum := 0
	for sum < 10 {
		sum += 3
		fmt.Printf("  sum = %d\n", sum)
	}
	// 输出: 3, 6, 9, 12

	// ---- 3. 无限循环 + break ----
	fmt.Println("--- 无限循环 + break ---")
	count := 0
	for {
		count++
		if count > 3 {
			break
		}
		fmt.Printf("  count = %d\n", count)
	}
	// 输出: 1, 2, 3

	// ---- 4. continue ----
	fmt.Println("--- continue（跳过偶数）---")
	for i := 1; i <= 10; i++ {
		if i%2 == 0 {
			continue // 跳过偶数
		}
		fmt.Printf("  %d ", i)
	}
	fmt.Println() // 输出: 1 3 5 7 9

	// ---- 5. for-range 遍历 slice ----
	fmt.Println("--- for-range 遍历 slice ---")
	fruits := []string{"苹果", "香蕉", "橙子"}
	for index, value := range fruits {
		fmt.Printf("  fruits[%d] = %s\n", index, value)
	}

	// 只需要索引
	for i := range fruits {
		fmt.Printf("  索引: %d\n", i)
	}

	// 只需要值（用 _ 忽略索引）
	for _, fruit := range fruits {
		fmt.Printf("  水果: %s\n", fruit)
	}

	// ---- 6. for-range 遍历 map ----
	fmt.Println("--- for-range 遍历 map ---")
	capitals := map[string]string{
		"中国": "北京",
		"日本": "东京",
		"韩国": "首尔",
	}
	for country, capital := range capitals {
		fmt.Printf("  %s 的首都是 %s\n", country, capital)
	}
	// 注意：map 的遍历顺序不确定！

	// ---- 7. for-range 遍历字符串（按 rune 遍历） ----
	fmt.Println("--- for-range 遍历字符串 ---")
	s := "Hello, 世界"
	for i, r := range s {
		fmt.Printf("  位置 %d: %c (rune=%d)\n", i, r, r)
	}
	// 注意：索引是 rune 的起始字节位置，不连续！

	// ---- 8. Go 1.22+：range over int ----
	// 直接遍历整数 0 到 n-1
	fmt.Println("--- range over int (Go 1.22+) ---")
	for i := range 5 {
		fmt.Printf("  i = %d\n", i)
	}
	// 输出: 0, 1, 2, 3, 4

	// ---- 9. break 指定标签（跳出外层循环） ----
	fmt.Println("--- 带标签的 break ---")
outer:
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if i*j > 2 {
				fmt.Printf("  在 i=%d, j=%d 时跳出\n", i, j)
				break outer
			}
			fmt.Printf("  i=%d, j=%d\n", i, j)
		}
	}
}

// 编译运行：go run 03_for_loop.go
