// ============================================================================
// 知识点: JSON 序列化与反序列化
//
// 说明:
// - encoding/json 包提供 JSON 编码和解码
// - 结构体通过 struct tag 控制 JSON 字段名
// - json.Marshal 序列化, json.Unmarshal 反序列化
// - json.NewEncoder / json.NewDecoder 实现流式 JSON 处理
// - 未导出的字段不会被序列化
//
// 编译和运行:
//   go run 14_file_io\03_json_marshal.go
// ============================================================================

package main

import (
	"encoding/json"
	"fmt"
)

type User struct {
	ID       int      `json:"id"`
	Name     string   `json:"name"`
	Email    string   `json:"email,omitempty"`
	Roles    []string `json:"roles"`
	password string   // 未导出, 不会被序列化
}

func main() {
	// 序列化
	user := User{
		ID:       1,
		Name:     "Alice",
		Email:    "alice@example.com",
		Roles:    []string{"admin", "user"},
		password: "secret123",
	}

	jsonData, err := json.MarshalIndent(user, "", "  ")
	if err != nil {
		fmt.Println("序列化失败:", err)
		return
	}
	fmt.Println("JSON 输出:")
	fmt.Println(string(jsonData))

	// 反序列化
	jsonInput := `{"id":2,"name":"Bob","email":"bob@example.com","roles":["user"]}`
	var newUser User
	if err := json.Unmarshal([]byte(jsonInput), &newUser); err != nil {
		fmt.Println("反序列化失败:", err)
		return
	}
	fmt.Printf("反序列化结果: %+v\n", newUser)

	// 流式写入 JSON (可用于配置文件)
	jsonBytes, _ := json.Marshal(user)
	fmt.Println("紧凑格式:", string(jsonBytes))
}
