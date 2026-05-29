// ============================================================
// 知识点：数组（Array）
//
// 数组是固定长度的同类型元素序列。
// Go 中数组的长度是类型的一部分：[3]int 和 [5]int 是不同的类型。
// 数组是值类型，赋值或传参时会复制整个数组。
//
// 编译运行方法：
//   go run 01_arrays.go
// ============================================================

package main

import "fmt"

func main() {
	// -------- 数组声明 --------
	var arr1 [5]int               // 声明长度为5的int数组，元素初始化为零值0
	arr2 := [3]string{"a", "b", "c"} // 声明并初始化
	arr3 := [...]int{1, 2, 3, 4}     // 由初始化器自动推断长度
	fmt.Println("arr1:", arr1)
	fmt.Println("arr2:", arr2)
	fmt.Println("arr3:", arr3)

	// -------- 指定索引初始化 --------
	arr4 := [5]int{0: 10, 2: 30, 4: 50} // 索引0=10, 索引2=30, 索引4=50
	fmt.Println("arr4:", arr4)

	// -------- 访问和修改元素 --------
	arr3[0] = 100
	fmt.Println("arr3[0]:", arr3[0])
	fmt.Println("arr3长度:", len(arr3))

	// -------- 数组是值类型 --------
	original := [3]int{1, 2, 3}
	copied := original         // 复制整个数组
	copied[0] = 999
	fmt.Println("original:", original) // 不受影响
	fmt.Println("copied:", copied)

	// -------- 遍历数组 --------
	fmt.Println("\n=== 遍历数组 ===")
	for i, v := range arr4 {
		fmt.Printf("arr4[%d] = %d\n", i, v)
	}

	// -------- 多维数组 --------
	matrix := [2][3]int{
		{1, 2, 3},
		{4, 5, 6},
	}
	fmt.Println("\n二维数组:", matrix)
}
