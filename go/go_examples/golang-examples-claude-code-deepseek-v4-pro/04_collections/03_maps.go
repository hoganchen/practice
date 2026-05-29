// ============================================================
// 知识点：映射（Map）
//
// Map 是 Go 内置的哈希表数据结构（键值对集合）。
// 使用 make() 或 map 字面量创建。key 必须是可比较的类型。
// 遍历顺序不保证！每次遍历可能不同。
// comma-ok 惯用法用于判断 key 是否存在。
// ============================================================

package main

import (
	"fmt"
	"sort"
)

func main() {
	// ---- 1. 创建 Map ----
	fmt.Println("--- 创建 Map ---")

	// 方式1：字面量
	scores := map[string]int{
		"Alice": 95,
		"Bob":   87,
		"Carol": 92,
	}
	fmt.Println("scores:", scores)

	// 方式2：make
	var ages map[string]int // nil map
	ages = make(map[string]int) // 初始化为空 map
	ages = make(map[string]int, 10) // 指定初始容量（性能优化）

	// 注意：nil map 不能写入
	var m map[string]int
	fmt.Println("nil map:", m == nil) // true
	// m["key"] = 1  // 运行时 panic！nil map 不能写入
	m = make(map[string]int)
	m["key"] = 1 // 现在可以了
	fmt.Println("初始化后:", m)

	// ---- 2. 增删改查 ----
	fmt.Println("\n--- 基本操作 ---")

	// 写入/更新
	ages["Alice"] = 30
	ages["Bob"] = 25
	ages["Charlie"] = 35
	fmt.Println("ages:", ages)

	// 读取
	fmt.Println("Alice 的年龄:", ages["Alice"])

	// 读取不存在的 key 返回零值
	fmt.Println("未知 key (David) 的年龄:", ages["David"]) // 0

	// comma-ok 惯用法
	if age, ok := ages["Alice"]; ok {
		fmt.Printf("Alice 存在，年龄=%d\n", age)
	}
	if _, ok := ages["David"]; !ok {
		fmt.Println("David 不存在")
	}

	// 删除
	delete(ages, "Charlie")
	fmt.Println("删除 Charlie 后:", ages)

	// 删除不存在的 key 也是安全的（不会 panic）
	delete(ages, "Unknown")

	// ---- 3. 遍历 Map ----
	fmt.Println("\n--- 遍历 Map ---")
	for name, age := range ages {
		fmt.Printf("  %s 的年龄是 %d\n", name, age)
	}

	// 如果需要按键排序遍历
	names := make([]string, 0, len(ages))
	for name := range ages {
		names = append(names, name)
	}
	sort.Strings(names)
	fmt.Println("按键排序遍历:")
	for _, name := range names {
		fmt.Printf("  %s -> %d\n", name, ages[name])
	}

	// ---- 4. Map 存储复合类型 ----
	fmt.Println("\n--- 复合类型 ---")

	// map 的值为 slice
	studentCourses := map[string][]string{
		"Alice": {"数学", "物理", "计算机"},
		"Bob":   {"英语", "历史"},
	}
	for name, courses := range studentCourses {
		fmt.Printf("  %s 选了 %v\n", name, courses)
	}

	// 嵌套 map
	metrics := map[string]map[string]int{
		"server1": {"cpu": 50, "mem": 60},
		"server2": {"cpu": 80, "mem": 40},
	}
	fmt.Println("server1 CPU:", metrics["server1"]["cpu"])

	// ---- 5. 零值与 nil 的区分 ----
	fmt.Println("\n--- nil vs 空 map ---")
	var nilMap map[string]int
	emptyMap := map[string]int{}

	fmt.Printf("nilMap: len=%d, isNil=%t\n", len(nilMap), nilMap == nil)
	fmt.Printf("emptyMap: len=%d, isNil=%t\n", len(emptyMap), emptyMap == nil)

	// 读取 nil map 是安全的（返回零值）
	fmt.Println("nilMap['x']:", nilMap["x"])

	// ---- 6. Map 集合运算 ----
	fmt.Println("\n--- 集合运算 ---")

	// 用 map 模拟集合
	set := map[int]bool{}
	set[1] = true
	set[2] = true
	set[3] = true

	// 检查元素是否存在
	if set[2] {
		fmt.Println("2 在集合中")
	}
	if !set[4] {
		fmt.Println("4 不在集合中")
	}

	// 用 struct{} 作为值来节省内存
	structSet := map[int]struct{}{
		1: {}, 2: {}, 3: {},
	}
	if _, ok := structSet[2]; ok {
		fmt.Println("2 在 structSet 中")
	}
}

// 编译运行：go run 03_maps.go
