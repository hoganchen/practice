// ============================================================================
// 知识点: slices 包 (Go 1.21+)
//
// 说明:
// - slices 包提供泛型切片操作函数
// - slices.Contains / slices.Index / slices.Sort
// - slices.Clone / slices.Delete / slices.Insert
// - slices.Compact 去除相邻重复
// - slices.BinarySearch 二分查找
//
// 编译和运行:
//   go run 33_slices_advanced\01_slices_package.go
// ============================================================================

package main

import (
	"fmt"
	"slices"
)

func main() {
	// 基本操作
	nums := []int{5, 2, 8, 1, 9, 3, 5, 2}
	fmt.Println("原始:", nums)

	// 排序
	slices.Sort(nums)
	fmt.Println("排序后:", nums)

	// 查找
	fmt.Println("Contains 5:", slices.Contains(nums, 5))
	fmt.Println("Index of 3:", slices.Index(nums, 3))

	// 二分查找 (要求已排序)
	idx, found := slices.BinarySearch(nums, 5)
	fmt.Printf("BinarySearch 5: idx=%d, found=%t\n", idx, found)

	// 去重 (相邻重复)
	unique := slices.Compact(nums)
	fmt.Println("Compact:", unique)

	// 克隆
	clone := slices.Clone(nums)
	fmt.Println("Clone:", clone)

	// 删除元素
	without := slices.Delete(nums, 2, 4) // 删除 [2, 4) 区间
	fmt.Println("Delete [2,4):", without)

	// 插入
	inserted := slices.Insert(nums, 3, 100, 200)
	fmt.Println("Insert 100,200 at 3:", inserted)

	// 比较
	fmt.Println("Equal(nums, clone):", slices.Equal(nums, clone))

	// 字符串切片
	names := []string{"Charlie", "Alice", "Bob"}
	slices.Sort(names)
	fmt.Println("Sorted names:", names)
}
