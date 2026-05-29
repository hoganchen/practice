// ============================================================
// 知识点：结构体（Struct）
//
// 结构体是 Go 中定义复合数据类型的主要方式。
// 支持字段标签（Tag），常用于序列化/验证。
// 可见性由首字母大小写控制：大写=公开，小写=私有。
// ============================================================

package main

import (
	"encoding/json"
	"fmt"
)

// ---- 1. 定义结构体 ----
// Person 是一个公开结构体（首字母大写）
type Person struct {
	Name    string   // 公开字段
	Age     int
	Email   string
	Hobbies []string
}

// ---- 2. 带标签的结构体 ----
// 字段标签（Tag）是元数据，运行时可反射读取
type User struct {
	ID        int64  `json:"id" yaml:"id"`
	Username  string `json:"username"`
	Password  string `json:"-"`              // - 表示 JSON 序列化时忽略
	CreatedAt string `json:"created_at,omitempty"` // omitempty 表示空值时忽略
}

// ---- 3. 结构体组合（非嵌入） ----
type Address struct {
	Province string
	City     string
	Detail   string
}

type Employee struct {
	Person          // 嵌入（匿名字段）
	EmployeeID string
	Address    Address // 普通组合
}

func main() {
	// ---- 1. 创建结构体实例 ----
	fmt.Println("--- 创建结构体 ---")

	// 方式1：按字段顺序（不推荐，容易出错）
	p1 := Person{"Alice", 30, "alice@example.com", []string{"读书", "游泳"}}
	fmt.Println("p1:", p1)

	// 方式2：指定字段名（推荐）
	p2 := Person{
		Name:    "Bob",
		Age:     25,
		Email:   "bob@example.com",
		Hobbies: []string{"编程", "摄影"},
	}
	fmt.Println("p2:", p2)

	// 方式3：部分初始化（未指定字段为零值）
	p3 := Person{Name: "Carol"}
	fmt.Printf("p3: Name=%s, Age=%d, Email=%s, Hobbies=%v\n",
		p3.Name, p3.Age, p3.Email, p3.Hobbies)

	// ---- 2. 结构体是值类型 ----
	fmt.Println("\n--- 结构体是值类型 ---")
	p4 := p2 // 完整拷贝！
	p4.Name = "David"
	fmt.Println("p2.Name:", p2.Name) // "Bob"（不变）
	fmt.Println("p4.Name:", p4.Name) // "David"

	// ---- 3. 结构体指针 ----
	fmt.Println("\n--- 结构体指针 ---")
	pp := &Person{Name: "Eve", Age: 28}
	fmt.Println("(*pp).Name:", (*pp).Name) // 显式解引用
	fmt.Println("pp.Name:", pp.Name)       // 语法糖，Go 自动解引用

	// 通过指针修改
	pp.Age = 29
	fmt.Println("pp.Age:", pp.Age)

	// new 创建
	p5 := new(Person)
	p5.Name = "Frank"
	fmt.Println("p5:", p5)

	// ---- 4. 结构体标签（Tag）与 JSON ----
	fmt.Println("\n--- 结构体标签与 JSON ---")
	user := User{
		ID:       1001,
		Username: "gopher",
		Password: "secret123",
	}

	jsonBytes, _ := json.Marshal(user)
	fmt.Println("JSON:", string(jsonBytes))
	// {"id":1001,"username":"gopher"}   ← Password 被忽略，CreatedAt 为空被忽略

	// JSON 反序列化
	jsonStr := `{"id":2002,"username":"newgopher"}`
	var newUser User
	json.Unmarshal([]byte(jsonStr), &newUser)
	fmt.Printf("反序列化: ID=%d, Username=%s\n", newUser.ID, newUser.Username)

	// ---- 5. 匿名字段 + 嵌入 ----
	fmt.Println("\n--- 嵌入结构体 ---")
	emp := Employee{
		Person: Person{
			Name:    "Grace",
			Age:     32,
			Email:   "grace@company.com",
			Hobbies: []string{"旅行"},
		},
		EmployeeID: "EMP001",
		Address: Address{
			Province: "北京",
			City:     "北京市",
			Detail:   "朝阳区",
		},
	}
	// 嵌入字段可以像自己的字段一样访问
	fmt.Println("姓名:", emp.Name)      // 直接从 Person 提升
	fmt.Println("员工ID:", emp.EmployeeID)
	fmt.Println("城市:", emp.Address.City) // 普通组合需要显式访问

	// ---- 6. 匿名结构体 ----
	fmt.Println("\n--- 匿名结构体 ---")
	// 一次性使用的结构体，不需要单独定义
	book := struct {
		Title  string
		Author string
		Pages  int
	}{
		Title:  "Go 语言编程",
		Author: "张三",
		Pages:  350,
	}
	fmt.Printf("书名: %s, 作者: %s, 页数: %d\n", book.Title, book.Author, book.Pages)
}

// 编译运行：go run 01_structs.go
