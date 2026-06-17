// ============================================================================
// 知识点: 结构体标签 (Struct Tags)
//
// 说明:
// - 结构体标签是字段后的元信息字符串: `key:"value" key2:"value2"`
// - 标签不会被 Go 编译器直接使用, 而是通过 reflect 包读取
// - 常见标签: json, xml, yaml, db, validate, form
// - 多个标签用空格分隔, 值中用逗号分隔选项
// - 标签常用于: JSON 序列化、ORM 映射、表单验证
//
// 编译和运行:
//   go run 08_structs\04_struct_tags.go
// ============================================================================

package main

import (
	"fmt"
	"reflect"
)

type User struct {
	ID       int    `json:"id" db:"primary_key"`
	Name     string `json:"name" validate:"required,min=2"`
	Email    string `json:"email,omitempty" validate:"email"`
	Password string `json:"-"` // "-" 表示忽略该字段
}

func main() {
	t := reflect.TypeOf(User{})

	fmt.Println("User 结构体标签:")
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		tag := field.Tag

		fmt.Printf("  字段 %s:\n", field.Name)
		fmt.Printf("    json: %q\n", tag.Get("json"))
		fmt.Printf("    validate: %q\n", tag.Get("validate"))
		fmt.Printf("    db: %q\n", tag.Get("db"))
	}

	// 实际使用: JSON 根据标签序列化
	user := User{
		ID:       1,
		Name:     "Alice",
		Email:    "alice@example.com",
		Password: "secret123",
	}

	fmt.Println("\nJSON 序列化 (根据 json 标签):")
	fmt.Printf("  %+v\n", user)
	fmt.Println("  Password 字段有 json:\"-\" 标签, 不会出现在 JSON 中")
}
