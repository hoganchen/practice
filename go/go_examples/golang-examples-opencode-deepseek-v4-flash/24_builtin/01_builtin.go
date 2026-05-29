// ============================================================
// 知识点：内置函数 min / max / clear（Go 1.21+）
//
// Go 1.21 新增了三个重要的内置函数：
//   min(a, b, ...) — 返回最小值（可比较任意有序类型）
//   max(a, b, ...) — 返回最大值
//   clear(m) / clear(s) — 清空 map 所有键值对，或将切片元素置零
//
// 编译运行方法：
//   go run 01_builtin.go
// ============================================================

package main

import "fmt"

func main() {
	// -------- min / max 基础用法 --------
	fmt.Println("=== min / max ===")
	fmt.Println("min(3, 7):", min(3, 7))
	fmt.Println("max(3, 7):", max(3, 7))
	fmt.Println("min(1.5, 2.5, 0.5):", min(1.5, 2.5, 0.5))
	fmt.Println("max(1.5, 2.5, 0.5):", max(1.5, 2.5, 0.5))
	fmt.Println("min(\"apple\", \"banana\"):", min("apple", "banana"))
	fmt.Println("max(\"apple\", \"banana\"):", max("apple", "banana"))

	// 支持任意数量的参数（>= 2）
	fmt.Println("min(10, 20, 5, 30):", min(10, 20, 5, 30))

	// -------- clear 清空 map --------
	fmt.Println("\n=== clear(map) ===")
	scores := map[string]int{
		"张三": 95,
		"李四": 87,
		"王五": 76,
	}
	fmt.Println("清空前:", scores, "长度:", len(scores))
	clear(scores)
	fmt.Println("清空后:", scores, "长度:", len(scores))

	// -------- clear 将切片元素置零 --------
	fmt.Println("\n=== clear(slice) ===")
	nums := []int{1, 2, 3, 4, 5}
	fmt.Println("置零前:", nums)
	clear(nums)
	fmt.Println("置零后:", nums)

	// clear 不改变切片长度，只将每个元素设为零值
	strs := []string{"a", "b", "c"}
	fmt.Println("\n字符串切片置零前:", strs)
	clear(strs)
	fmt.Println("字符串切片置零后:", strs) // ["", "", ""]
}
