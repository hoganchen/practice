// ============================================================
// 知识点：Map（映射/字典）
//
// Map 是 Go 内置的键值对集合，底层基于哈希表实现。
// 声明：map[KeyType]ValueType
// 使用 make() 或字面量创建，nil map 不能直接写入。
//
// 编译运行方法：
//   go run 01_maps.go
// ============================================================

package main

import "fmt"

func main() {
	// -------- 创建 map --------
	// 方式1：make 创建
	scores := make(map[string]int)
	scores["张三"] = 95
	scores["李四"] = 87
	fmt.Println("scores:", scores)

	// 方式2：字面量创建
	grades := map[string]string{
		"张三": "优秀",
		"李四": "良好",
		"王五": "及格",
	}
	fmt.Println("grades:", grades)

	// -------- 增删改查 --------
	// 添加/修改
	grades["赵六"] = "优秀"   // 新增
	grades["张三"] = "不及格" // 修改

	// 查找（双返回值：值和是否存在）
	value, exists := grades["张三"]
	if exists {
		fmt.Println("张三的成绩:", value)
	}

	// 查找不存在的键
	value, exists = grades["未知"]
	fmt.Printf("未知: value=%q, exists=%v\n", value, exists)

	// 删除
	delete(grades, "李四")
	fmt.Println("删除后:", grades)

	// -------- 遍历 map --------
	fmt.Println("\n=== 遍历 ===")
	for name, grade := range grades {
		fmt.Printf("%s -> %s\n", name, grade)
	}

	// 只遍历 key
	for name := range grades {
		fmt.Println("key:", name)
	}

	// -------- map 是引用类型 --------
	original := map[string]int{"a": 1, "b": 2}
	copied := original  // 引用传递，不是复制
	copied["a"] = 999
	fmt.Println("\noriginal:", original) // a=999，被修改
	fmt.Println("copied:", copied)

	// -------- 获取 map 长度 --------
	fmt.Println("grades 长度:", len(grades))
}
