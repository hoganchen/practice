// ============================================================================
// 知识点: sort.Interface 自定义排序
//
// 说明:
// - 实现 sort.Interface 接口可以自定义排序行为
// - 接口需要实现三个方法: Len(), Less(i, j int) bool, Swap(i, j int)
// - 适用于需要多种排序方式的场景
//
// 编译和运行:
//   go run 23_sorting\02_sort_custom.go
// ============================================================================

package main

import (
	"fmt"
	"sort"
)

type Student struct {
	Name  string
	Score int
	Grade string
}

// Students 实现了 sort.Interface
type Students []Student

func (s Students) Len() int           { return len(s) }
func (s Students) Less(i, j int) bool { return s[i].Score > s[j].Score } // 按分数降序
func (s Students) Swap(i, j int)      { s[i], s[j] = s[j], s[i] }

// ByName 按姓名排序
type ByName struct{ Students }

func (n ByName) Less(i, j int) bool { return n.Students[i].Name < n.Students[j].Name }

func main() {
	students := Students{
		{Name: "Alice", Score: 92, Grade: "A"},
		{Name: "Bob", Score: 78, Grade: "B"},
		{Name: "Charlie", Score: 85, Grade: "B"},
		{Name: "David", Score: 95, Grade: "A"},
	}

	fmt.Println("原始:", students)

	// 按分数降序
	sort.Sort(students)
	fmt.Println("按分数降序:", students)

	// 按姓名升序
	sort.Sort(ByName{students})
	fmt.Println("按姓名升序:", students)
}
