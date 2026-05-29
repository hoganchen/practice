// ============================================================
// 知识点：数组（Array）
//
// 数组是固定长度的同类型元素序列。
// 长度是数组类型的一部分：[5]int 和 [10]int 是不同类型的。
// 数组是值类型：复制或传参会完整拷贝整个数组（而非引用）。
// 在实际 Go 代码中，更常用的是 slice 而非数组。
// ============================================================

package main

import "fmt"

func main() {
	// ---- 1. 数组声明 ----
	fmt.Println("--- 数组声明 ---")
	var arr1 [5]int                 // 默认零值：{0, 0, 0, 0, 0}
	arr2 := [3]int{1, 2, 3}        // 声明并初始化
	arr3 := [5]int{1, 2, 3}        // 部分初始化：{1, 2, 3, 0, 0}
	arr4 := [...]int{4, 5, 6, 7}   // 由编译器推断长度（长度为 4）
	arr5 := [...]int{9: 99}         // 指定索引初始化，长度 10

	fmt.Println("arr1:", arr1)
	fmt.Println("arr2:", arr2)
	fmt.Println("arr3:", arr3)
	fmt.Println("arr4:", arr4, "长度:", len(arr4))
	fmt.Println("arr5:", arr5, "长度:", len(arr5)) // [0 0 0 0 0 0 0 0 0 99]

	// ---- 2. 数组元素访问与修改 ----
	fmt.Println("\n--- 元素访问与修改 ---")
	colors := [3]string{"红", "绿", "蓝"}
	fmt.Println("colors[0]:", colors[0])
	fmt.Println("colors[2]:", colors[2])

	colors[1] = "黄"
	fmt.Println("修改后:", colors) // [红 黄 蓝]

	// ---- 3. 数组是值类型 ----
	fmt.Println("\n--- 数组是值类型 ---")
	original := [3]int{10, 20, 30}
	copied := original // 完整拷贝数组！
	copied[0] = 999

	fmt.Println("original:", original) // [10 20 30]（不变）
	fmt.Println("copied:", copied)     // [999 20 30]（独立副本）

	// ---- 4. 函数传参（值拷贝） ----
	fmt.Println("\n--- 函数传参 ---")
	modifyFirst := func(arr [3]int) {
		arr[0] = 100
	}
	nums := [3]int{1, 2, 3}
	modifyFirst(nums)
	fmt.Println("调用后:", nums) // [1 2 3]（不变）

	// 传指针才能修改
	modifyFirstPtr := func(arr *[3]int) {
		arr[0] = 100
	}
	modifyFirstPtr(&nums)
	fmt.Println("传指针后:", nums) // [100 2 3]

	// ---- 5. 数组遍历 ----
	fmt.Println("\n--- 数组遍历 ---")
	for i := 0; i < len(colors); i++ {
		fmt.Printf("  colors[%d] = %s\n", i, colors[i])
	}

	for index, value := range colors {
		fmt.Printf("  range: [%d] = %s\n", index, value)
	}

	// ---- 6. 多维数组 ----
	fmt.Println("\n--- 二维数组 ---")
	matrix := [2][3]int{
		{1, 2, 3},
		{4, 5, 6},
	}
	for i := 0; i < 2; i++ {
		for j := 0; j < 3; j++ {
			fmt.Printf("  matrix[%d][%d] = %d\n", i, j, matrix[i][j])
		}
	}
}

// 编译运行：go run 01_arrays.go
