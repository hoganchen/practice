// ============================================================================
// 知识点: 切片 (Slice)
//
// 说明:
// - 切片是动态数组, 是对底层数组的抽象和封装
// - 创建方式: make([]类型, 长度, 容量), 字面量, 从数组截取
// - 切片是引用类型, 包含指针、长度、容量三个字段
// - append 函数用于向切片追加元素, 容量不足时自动扩容
// - 截取语法: s[low:high] 左闭右开
// - nil 切片的长度和容量都为0
//
// 编译和运行:
//   go run 05_collections\02_slice.go
// ============================================================================

package main

import "fmt"

func main() {
	// 创建切片
	s1 := []int{1, 2, 3, 4, 5}
	s2 := make([]string, 3, 5) // len=3, cap=5

	fmt.Println("s1:", s1, "len:", len(s1), "cap:", cap(s1))
	fmt.Println("s2:", s2, "len:", len(s2), "cap:", cap(s2))

	// 从数组截取
	arr := [5]int{10, 20, 30, 40, 50}
	s3 := arr[1:4] // [20, 30, 40]
	fmt.Println("arr[1:4]:", s3)

	// append 追加
	s4 := []int{1, 2, 3}
	s4 = append(s4, 4, 5, 6)
	s4 = append(s4, []int{7, 8, 9}...)
	fmt.Println("append 后:", s4)

	// 切片扩容机制
	s5 := make([]int, 0, 2)
	fmt.Printf("cap=%d\n", cap(s5))
	for i := 0; i < 10; i++ {
		s5 = append(s5, i)
		if cap(s5) != cap(s5)-1 && i < 3 || i%3 == 0 {
			fmt.Printf("  append %d: len=%d cap=%d\n", i, len(s5), cap(s5))
		}
	}

	// nil 切片
	var s6 []int
	fmt.Println("nil 切片:", s6, "len:", len(s6), "cap:", cap(s6), "is nil:", s6 == nil)
}
