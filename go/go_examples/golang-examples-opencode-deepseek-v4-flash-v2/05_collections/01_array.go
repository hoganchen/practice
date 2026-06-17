// ============================================================================
// 知识点: 数组 (Array)
//
// 说明:
// - 数组是固定长度的同类型元素序列, 长度是类型的一部分
// - 声明: var 变量名 [长度]类型
// - 数组是值类型, 赋值或传参会复制整个数组
// - 多维数组: [行数][列数]类型
//
// 编译和运行:
//   go run 05_collections\01_array.go
// ============================================================================

package main

import "fmt"

func main() {
	// 声明并初始化
	var arr1 [3]int = [3]int{1, 2, 3}
	arr2 := [5]int{1, 2, 3, 4, 5}
	arr3 := [...]int{10, 20, 30, 40} // 由编译器推断长度

	fmt.Println("arr1:", arr1)
	fmt.Println("arr2:", arr2)
	fmt.Println("arr3:", arr3, "长度:", len(arr3))

	// 指定索引初始化
	arr4 := [5]int{0: 100, 3: 300}
	fmt.Println("arr4:", arr4)

	// 数组是值类型
	arrA := [3]int{1, 2, 3}
	arrB := arrA // 复制整个数组
	arrB[0] = 999
	fmt.Println("arrA (值类型):", arrA) // 不受影响
	fmt.Println("arrB:", arrB)

	// 遍历数组
	for i, v := range arrA {
		fmt.Printf("  arrA[%d] = %d\n", i, v)
	}
}
