// ============================================================
// 知识点：切片（Slice）
//
// 切片是 Go 中最常用的数据结构，是数组的动态视图。
// 切片本身不存储数据，它只是底层数组的引用。
// 由三部分组成：指针（指向底层数组）、长度（len）、容量（cap）。
//
// 核心操作：
//   make([]T, len, cap) — 创建切片
//   append(slice, elems) — 追加元素
//   slice[low:high] — 切片操作
//   copy(dst, src) — 复制切片
//
// 编译运行方法：
//   go run 02_slices.go
// ============================================================

package main

import "fmt"

func main() {
	// -------- 创建切片的三种方式 --------
	// 方式1：字面量
	s1 := []int{1, 2, 3, 4, 5}
	fmt.Println("s1:", s1, "len:", len(s1), "cap:", cap(s1))

	// 方式2：make
	s2 := make([]int, 3, 5) // 长度3，容量5，元素为0
	fmt.Println("s2:", s2, "len:", len(s2), "cap:", cap(s2))

	// 方式3：从数组切片
	arr := [5]int{10, 20, 30, 40, 50}
	s3 := arr[1:4] // 取索引[1,4)，即 [20, 30, 40]
	fmt.Println("s3:", s3, "len:", len(s3), "cap:", cap(s3))

	// -------- append —— 切片的动态扩容 --------
	var dynamic []int
	for i := 0; i < 10; i++ {
		dynamic = append(dynamic, i)
		fmt.Printf("追加 %d: len=%d, cap=%d\n", i, len(dynamic), cap(dynamic))
	}

	// -------- 切片操作 [low:high] --------
	numbers := []int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}
	fmt.Println("\nnums[:5]:", numbers[:5])   // [0 1 2 3 4]
	fmt.Println("nums[3:]:", numbers[3:])     // [3 4 5 6 7 8 9]
	fmt.Println("nums[2:7]:", numbers[2:7])   // [2 3 4 5 6]
	fmt.Println("nums[:]:", numbers[:])       // 全部

	// -------- 切片共享底层数组 --------
	fmt.Println("\n=== 切片共享底层数组 ===")
	data := []int{1, 2, 3, 4, 5}
	sliceA := data[0:3] // [1, 2, 3]
	sliceB := data[2:5] // [3, 4, 5]
	sliceA[2] = 999     // 修改 sliceA 的第三个元素
	fmt.Println("data:", data)       // [1 2 999 4 5]
	fmt.Println("sliceA:", sliceA)   // [1 2 999]
	fmt.Println("sliceB:", sliceB)   // [999 4 5]

	// -------- copy 复制切片（深拷贝）--------
	fmt.Println("\n=== copy 深拷贝 ===")
	src := []int{1, 2, 3}
	dst := make([]int, len(src))
	copied := copy(dst, src)
	fmt.Println("复制了", copied, "个元素")
	dst[0] = 999
	fmt.Println("src:", src) // [1 2 3] 不受影响
	fmt.Println("dst:", dst) // [999 2 3]

	// -------- 零值切片和 nil 切片 --------
	var nilSlice []int
	emptySlice := []int{}
	fmt.Println("\nnilSlice == nil:", nilSlice == nil, "len:", len(nilSlice))
	fmt.Println("emptySlice == nil:", emptySlice == nil, "len:", len(emptySlice))
}
