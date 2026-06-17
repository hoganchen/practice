// ============================================================================
// 知识点: 结构体定义与使用
//
// 说明:
// - struct 是Go中用于定义复合数据类型的关键字
// - 结构体将多个字段组合成一个类型
// - 访问字段使用点号 .
// - 结构体是值类型, 赋值或传参会复制所有字段
// - 可以使用结构体字面量初始化, 支持按顺序或按字段名
//
// 编译和运行:
//   go run 08_structs\01_struct_definition.go
// ============================================================================

package main

import "fmt"

// 定义结构体
type Person struct {
	Name string
	Age  int
	City string
}

// 结构体嵌套
type Company struct {
	Name    string
	Address Address
}

type Address struct {
	Street  string
	City    string
	ZipCode string
}

func main() {
	// 按字段顺序初始化
	p1 := Person{"Alice", 30, "北京"}
	fmt.Println("p1:", p1)

	// 按字段名初始化 (推荐, 更清晰)
	p2 := Person{Name: "Bob", Age: 25, City: "上海"}
	fmt.Println("p2:", p2)

	// 部分字段初始化 (未指定字段为零值)
	p3 := Person{Name: "Charlie"}
	fmt.Println("p3:", p3)

	// 访问和修改字段
	p2.Age = 26
	fmt.Println("修改后 p2.Age:", p2.Age)

	// 结构体是值类型
	p4 := p2
	p4.Name = "David"
	fmt.Println("p2:", p2.Name, "p4:", p4.Name) // p2不受影响

	// 嵌套结构体
	company := Company{
		Name: "ACME Corp",
		Address: Address{
			Street:  "科技路100号",
			City:    "深圳",
			ZipCode: "518000",
		},
	}
	fmt.Printf("公司: %s, 地址: %s %s\n", company.Name, company.Address.City, company.Address.Street)
}
