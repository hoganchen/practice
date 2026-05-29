// ============================================================
// 知识点：结构体（Struct）
//
// 结构体是 Go 中自定义的复合数据类型，将多个字段聚合在一起。
// 结构体是值类型，赋值和传参时会复制整个结构体。
//
// 编译运行方法：
//   go run 01_structs.go
// ============================================================

package main

import "fmt"

// -------- 定义结构体 --------
type Person struct {
	Name string
	Age  int
	City string
}

// -------- 带标签（Tag）的结构体字段 --------
// 标签是字段的元信息，常用于 JSON 序列化等场景
type Employee struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Salary float64
}

func main() {
	// -------- 创建结构体的多种方式 --------
	// 方式1：按字段顺序赋值（不推荐，易出错）
	p1 := Person{"张三", 30, "北京"}

	// 方式2：指定字段名（推荐）
	p2 := Person{Name: "李四", Age: 25, City: "上海"}

	// 方式3：部分字段初始化，未指定的使用零值
	p3 := Person{Name: "王五"}

	// 方式4：var 声明后逐个赋值
	var p4 Person
	p4.Name = "赵六"
	p4.Age = 28

	fmt.Println("p1:", p1)
	fmt.Println("p2:", p2)
	fmt.Println("p3:", p3)
	fmt.Println("p4:", p4)

	// -------- 访问和修改字段 --------
	p1.City = "深圳"
	fmt.Println("修改后 p1:", p1)

	// -------- 结构体是值类型 --------
	original := Person{Name: "原始", Age: 20}
	copied := original
	copied.Name = "复制品"
	fmt.Println("\noriginal:", original) // 不受影响
	fmt.Println("copied:", copied)

	// -------- 结构体指针 --------
	ptr := &p1
	fmt.Println("\n通过指针访问:", ptr.Name) // 自动解引用
	ptr.Age = 35                           // 等价于 (*ptr).Age = 35
	fmt.Println("修改后 p1:", p1)

	// -------- 匿名结构体（一次性使用）--------
	book := struct {
		Title  string
		Author string
		Pages  int
	}{
		Title:  "Go 语言编程",
		Author: "张三",
		Pages:  300,
	}
	fmt.Println("\n匿名结构体:", book)
}
