// ============================================================
// 知识点：切片（Slice）
//
// Slice 是 Go 最常用的数据结构，是对数组的动态视图。
// 与数组不同，slice 的长度可以动态变化。
// 底层是数组引用：slice 由指针 + 长度(len) + 容量(cap) 组成。
// 多个 slice 可能共享同一底层数组。
// ============================================================

package main

import (
	"fmt"
)

func main() {
	// ---- 1. 创建 Slice ----
	fmt.Println("--- 创建 Slice ---")

	// 方式1：字面量
	s1 := []int{1, 2, 3, 4, 5}
	fmt.Println("字面量:", s1)

	// 方式2：make（type, len, cap）
	s2 := make([]int, 3, 5) // 长度 3，容量 5
	fmt.Printf("make: %v, len=%d, cap=%d\n", s2, len(s2), cap(s2))

	// 方式3：从数组切片
	arr := [5]int{10, 20, 30, 40, 50}
	s3 := arr[1:4] // 左闭右开: [1, 4)
	fmt.Println("从数组切片 arr[1:4]:", s3) // [20, 30, 40]

	// ---- 2. 切片操作 ----
	fmt.Println("\n--- 切片操作 ---")
	nums := []int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}
	fmt.Println("nums:", nums)

	fmt.Println("nums[2:5]:", nums[2:5])    // [2 3 4]
	fmt.Println("nums[:3]:", nums[:3])      // [0 1 2]
	fmt.Println("nums[5:]:", nums[5:])      // [5 6 7 8 9]
	fmt.Println("nums[:]:", nums[:])        // 全部

	// ---- 3. append ----
	fmt.Println("\n--- append ---")
	var s []int // nil slice
	fmt.Println("nil slice, len:", len(s), "cap:", cap(s), "is nil:", s == nil)

	s = append(s, 1)
	s = append(s, 2, 3, 4)
	fmt.Println("append 后:", s)

	// append 多个元素（展开 slice）
	more := []int{5, 6}
	s = append(s, more...)
	fmt.Println("append slice 后:", s)

	// ---- 4. Slice 自动扩容 ----
	fmt.Println("\n--- 自动扩容 ---")
	slice := make([]int, 0, 2)
	for i := 1; i <= 10; i++ {
		slice = append(slice, i)
		fmt.Printf("  append %2d: len=%2d, cap=%2d\n", i, len(slice), cap(slice))
	}
	// 容量不够时，Go 通常以 2 倍扩容（小于 256 时）或 1.25 倍

	// ---- 5. copy ----
	fmt.Println("\n--- copy ---")
	src := []int{1, 2, 3, 4, 5}
	dst := make([]int, 3)
	n := copy(dst, src) // 复制 src 的前 3 个元素到 dst
	fmt.Printf("复制了 %d 个元素: dst=%v\n", n, dst)

	dst2 := make([]int, len(src))
	copy(dst2, src)
	fmt.Println("完全复制:", dst2)

	// ---- 6. Slice 共享底层数组 ----
	fmt.Println("\n--- 共享底层数组 ---")
	a := []int{1, 2, 3, 4, 5}
	b := a[1:4] // b 和 a 共享底层数组
	fmt.Println("a:", a, "b:", b)

	b[0] = 999 // 修改 b[0] 会影响 a
	fmt.Println("修改 b[0]=999 后:")
	fmt.Println("a:", a)
	fmt.Println("b:", b)

	// 但 append 超过容量时会分配新数组
	fmt.Println("\n--- append 超过容量触发新分配 ---")
	c := a[:3]
	fmt.Printf("c[:3]: %v, len=%d, cap=%d\n", c, len(c), cap(c))
	c = append(c, 100)
	fmt.Println("append 后 c:", c, "a:", a)
	// a[3] 被修改了，因为 c 和 a 仍然共享底层数组

	// ---- 7. Slice 技巧 ----
	fmt.Println("\n--- Slice 技巧 ---")
	data := []int{1, 2, 3, 4, 5, 6, 7, 8, 9}

	// 删除索引 3 的元素（保留顺序）
	index := 3
	data = append(data[:index], data[index+1:]...)
	fmt.Println("删除索引 3:", data) // [1 2 3 5 6 7 8 9]

	// 清空 slice（保留底层数组）
	data = data[:0]
	fmt.Println("清空后:", data, "len:", len(data), "cap:", cap(data))
}

// 编译运行：go run 02_slices.go
