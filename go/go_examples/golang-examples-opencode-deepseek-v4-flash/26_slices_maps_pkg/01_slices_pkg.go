// ============================================================
// 知识点：slices 标准包（Go 1.21+）
//
// slices 包提供了泛型切片操作函数，所有函数都支持任意元素类型。
// 常用函数：
//   BinarySearch / BinarySearchFunc — 二分查找
//   Clip — 将切片容量裁剪为长度
//   Clone — 浅拷贝切片
//   Compact / CompactFunc — 移除相邻重复元素
//   Contains — 检查元素是否存在
//   Delete — 删除指定范围元素
//   Equal / EqualFunc — 比较切片是否相等
//   Grow — 预分配容量
//   Index — 查找元素索引
//   Insert — 插入元素
//   IsSorted / IsSortedFunc — 检查是否有序
//   Max / Min — 最大/最小值
//   Replace — 替换元素
//   Sort / SortFunc / SortStableFunc — 排序
//
// 编译运行方法：
//   go run 01_slices_pkg.go
// ============================================================

package main

import (
	"fmt"
	"slices"
)

func main() {
	// -------- slices.Contains / Index --------
	fmt.Println("=== 查找 ===")
	nums := []int{10, 20, 30, 40, 50}
	fmt.Println("Contains(20):", slices.Contains(nums, 20))
	fmt.Println("Contains(99):", slices.Contains(nums, 99))
	fmt.Println("Index(30):", slices.Index(nums, 30))
	fmt.Println("Index(99):", slices.Index(nums, 99))

	// -------- slices.BinarySearch（要求已排序）--------
	fmt.Println("\n=== 二分查找 ===")
	sorted := []int{1, 3, 5, 7, 9, 11}
	index, found := slices.BinarySearch(sorted, 7)
	fmt.Printf("查找 7: index=%d, found=%v\n", index, found)
	index, found = slices.BinarySearch(sorted, 8)
	fmt.Printf("查找 8: index=%d, found=%v (8 应插入到 index 位置)\n", index, found)

	// -------- slices.Clone（浅拷贝）--------
	fmt.Println("\n=== Clone ===")
	original := []string{"a", "b", "c"}
	cloned := slices.Clone(original)
	cloned[0] = "xxx"
	fmt.Println("original:", original) // 不受影响
	fmt.Println("cloned:", cloned)

	// -------- slices.Delete --------
	fmt.Println("\n=== Delete ===")
	items := []int{0, 1, 2, 3, 4, 5}
	items = slices.Delete(items, 2, 4) // 删除索引 [2, 4)
	fmt.Println("Delete [2,4):", items) // [0, 1, 4, 5]

	// -------- slices.Insert --------
	fmt.Println("\n=== Insert ===")
	items2 := []int{1, 2, 5}
	items2 = slices.Insert(items2, 2, 3, 4) // 在索引2前插入3,4
	fmt.Println("Insert 3,4 at 2:", items2) // [1, 2, 3, 4, 5]

	// -------- slices.Sort / IsSorted --------
	fmt.Println("\n=== 排序 ===")
	unsorted := []int{3, 1, 4, 1, 5, 9, 2}
	fmt.Println("IsSorted:", slices.IsSorted(unsorted))
	slices.Sort(unsorted)
	fmt.Println("排序后:", unsorted)
	fmt.Println("IsSorted:", slices.IsSorted(unsorted))

	// -------- slices.Compact --------
	fmt.Println("\n=== Compact ===")
	withDups := []int{1, 1, 2, 2, 2, 3, 4, 4, 5}
	withDups = slices.Compact(withDups)
	fmt.Println("Compact:", withDups) // [1, 2, 3, 4, 5]

	// -------- slices.Max / Min --------
	fmt.Println("\n=== Max / Min ===")
	data := []int{45, 12, 78, 34, 90, 23}
	fmt.Println("Max:", slices.Max(data))
	fmt.Println("Min:", slices.Min(data))

	// -------- slices.Equal --------
	fmt.Println("\n=== Equal ===")
	a := []string{"x", "y", "z"}
	b := []string{"x", "y", "z"}
	c := []string{"x", "y", "Z"}
	fmt.Println("Equal(a, b):", slices.Equal(a, b))
	fmt.Println("Equal(a, c):", slices.Equal(a, c))

	// -------- slices.Clip 裁剪容量 --------
	fmt.Println("\n=== Clip ===")
	clipped := make([]int, 3, 10)
	fmt.Println("Clip前: len=", len(clipped), "cap=", cap(clipped))
	clipped = slices.Clip(clipped)
	fmt.Println("Clip后: len=", len(clipped), "cap=", cap(clipped))
}
