// ============================================================================
// 知识点: sort 包 - 基本排序
//
// 说明:
// - sort 包提供切片和自定义集合的排序功能
// - sort.Ints / sort.Float64s / sort.Strings 对基本类型排序
// - sort.Slice 使用 less 函数自定义排序
// - sort.Reverse 逆序
// - sort.Search 二分查找
//
// 编译和运行:
//   go run 23_sorting\01_sort_basic.go
// ============================================================================

package main

import (
	"fmt"
	"sort"
)

func main() {
	// 整型排序
	nums := []int{42, 13, 7, 99, 25, 3, 66}
	sort.Ints(nums)
	fmt.Println("升序:", nums)

	// 逆序
	sort.Sort(sort.Reverse(sort.IntSlice(nums)))
	fmt.Println("降序:", nums)

	// 字符串排序
	names := []string{"Bob", "Alice", "Charlie", "David"}
	sort.Strings(names)
	fmt.Println("字符串排序:", names)

	// 浮点数排序
	floats := []float64{3.14, 1.41, 2.72, 0.58}
	sort.Float64s(floats)
	fmt.Println("浮点数排序:", floats)

	// sort.Slice 自定义排序
	people := []struct {
		Name string
		Age  int
	}{
		{"Alice", 30},
		{"Bob", 25},
		{"Charlie", 35},
	}

	sort.Slice(people, func(i, j int) bool {
		return people[i].Age < people[j].Age
	})
	fmt.Println("按年龄排序:", people)

	// 二分查找
	idx := sort.SearchInts(nums, 25)
	fmt.Printf("25 在位置 %d\n", idx)
}
