package main

import "fmt"

func modifySlice(s []int) []int {
	// 未发生扩容，对slice的修改会影响到原始数据
	for i := 0; i < len(s); i++ {
		s[i] = i
	}

	s1 := make([]int, 10000)
	// 触发扩容的操作（如大量插入）
	for i := 0; i < 10000; i++ {
		// s = append(s, i)
		s1[i] = i
	}

	// 发生扩容，对slice的修改不会影响到原始数据
	s = append(s, s1...)

	// 可通过函数返回，但是会影响性能
	return s
}

/*
传递切片时，复制的是该结构体的副本（值传递），但指针仍指向同一底层数组。因此，函数内修改元素会影响外部切片（如 s[i] = x）。
但若函数内发生扩容（如 append），则底层数组会重新分配，此时外部切片不再共享新数组
*/
func main() {
	// originalSlice := []int{9: 0}
	originalSlice := make([]int, 10)
	fmt.Println(len(originalSlice))

	newSlice := modifySlice(originalSlice)

	fmt.Println(len(originalSlice))
	fmt.Println(originalSlice)

	fmt.Println(len(newSlice))
}
