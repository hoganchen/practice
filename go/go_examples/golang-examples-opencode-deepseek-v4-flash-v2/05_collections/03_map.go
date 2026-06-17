// ============================================================================
// 知识点: 映射 (Map)
//
// 说明:
// - map是键值对集合, 键类型必须是可比较类型(如string, int, bool)
// - 创建: make(map[K]V, 容量), 或字面量 map[K]V{}
// - 增删改查: m[key] = value, delete(m, key), value, ok := m[key]
// - 遍历顺序不固定(随机), 不要依赖遍历顺序
// - map是引用类型, 但零值为nil, nil map不能直接赋值
//
// 编译和运行:
//   go run 05_collections\03_map.go
// ============================================================================

package main

import "fmt"

func main() {
	// 创建 map
	scores := make(map[string]int)
	scores["Alice"] = 95
	scores["Bob"] = 87
	scores["Charlie"] = 92
	fmt.Println("scores:", scores)

	// 字面量创建
	config := map[string]string{
		"host": "localhost",
		"port": "8080",
	}
	fmt.Println("config:", config)

	// 获取值 (ok模式判断key是否存在)
	aliceScore, ok := scores["Alice"]
	if ok {
		fmt.Println("Alice 的成绩:", aliceScore)
	}

	_, exists := scores["Unknown"]
	fmt.Println("Unknown 是否存在:", exists)

	// 删除元素
	delete(scores, "Bob")
	fmt.Println("删除 Bob 后:", scores)

	// 遍历 map
	for name, score := range scores {
		fmt.Printf("  %s: %d分\n", name, score)
	}

	// map 长度
	fmt.Println("map 大小:", len(scores))
}
