// ============================================================
// 知识点：JSON 序列化与反序列化
//
// Go 的 encoding/json 包提供 JSON 编解码功能。
// 结构体标签（Tag）控制 JSON 字段名和行为。
// json.Marshal / json.Unmarshal 处理内存中的 JSON。
// json.Encoder / json.Decoder 处理流式 JSON（文件/网络）。
// ============================================================

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"
)

// ---- 1. 基本 JSON 结构体 ----
type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
	// 忽略空值
	Phone string `json:"phone,omitempty"`
	// - 表示始终忽略
	Password string `json:"-"`
}

// ---- 2. 嵌套结构体 ----
type Order struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Items     []Item    `json:"items"`
	Total     float64   `json:"total"`
	CreatedAt time.Time `json:"created_at"`
}

type Item struct {
	ProductName string  `json:"product_name"`
	Price       float64 `json:"price"`
	Quantity    int     `json:"quantity"`
}

// ---- 3. 自定义 JSON 编解码 ----
type Color struct {
	Red   uint8
	Green uint8
	Blue  uint8
	Alpha uint8
}

// 自定义 JSON: 序列化为十六进制字符串 "#FF00FF"
func (c Color) MarshalJSON() ([]byte, error) {
	return json.Marshal(fmt.Sprintf("#%02X%02X%02X%02X",
		c.Red, c.Green, c.Blue, c.Alpha))
}

// 自定义 JSON 反序列化
func (c *Color) UnmarshalJSON(data []byte) error {
	var hex string
	if err := json.Unmarshal(data, &hex); err != nil {
		return err
	}
	if len(hex) == 7 {
		fmt.Sscanf(hex, "#%02x%02x%02x", &c.Red, &c.Green, &c.Blue)
		c.Alpha = 255
	} else if len(hex) == 9 {
		fmt.Sscanf(hex, "#%02x%02x%02x%02x",
			&c.Red, &c.Green, &c.Blue, &c.Alpha)
	}
	return nil
}

// ---- 4. 动态 JSON（map[string]interface{}）----
// 当结构体不确定时使用

func main() {
	// ---- 1. 基本序列化 ----
	fmt.Println("--- 基本序列化 ---")

	user := User{
		ID:        1,
		Name:      "Alice",
		Email:     "alice@example.com",
		CreatedAt: time.Now(),
		Password:  "secret123", // 会被忽略
	}

	jsonBytes, err := json.Marshal(user)
	if err != nil {
		fmt.Println("序列化失败:", err)
		return
	}
	fmt.Printf("JSON: %s\n", string(jsonBytes))

	// 美化输出（带缩进）
	prettyJSON, _ := json.MarshalIndent(user, "", "  ")
	fmt.Printf("美化 JSON:\n%s\n", string(prettyJSON))

	// ---- 2. 基本反序列化 ----
	fmt.Println("\n--- 基本反序列化 ---")

	jsonStr := `{
		"id": 2,
		"name": "Bob",
		"email": "bob@example.com",
		"phone": "1234567890",
		"created_at": "2024-06-15T10:30:00Z"
	}`

	var newUser User
	err = json.Unmarshal([]byte(jsonStr), &newUser)
	if err != nil {
		fmt.Println("反序列化失败:", err)
		return
	}
	fmt.Printf("用户: ID=%d, Name=%s, Email=%s, Phone=%s\n",
		newUser.ID, newUser.Name, newUser.Email, newUser.Phone)
	fmt.Printf("创建时间: %s\n", newUser.CreatedAt.Format(time.RFC3339))

	// ---- 3. 嵌套结构体 ----
	fmt.Println("\n--- 嵌套 JSON ---")

	order := Order{
		ID:     1001,
		UserID: 1,
		Items: []Item{
			{ProductName: "笔记本电脑", Price: 5999.00, Quantity: 1},
			{ProductName: "鼠标", Price: 99.00, Quantity: 2},
		},
		Total:     6197.00,
		CreatedAt: time.Now(),
	}

	orderJSON, _ := json.MarshalIndent(order, "", "  ")
	fmt.Printf("订单 JSON:\n%s\n", string(orderJSON))

	// ---- 4. 自定义编解码 ----
	fmt.Println("\n--- 自定义 JSON ---")

	color := Color{Red: 255, Green: 0, Blue: 255, Alpha: 128}
	colorJSON, _ := json.Marshal(color)
	fmt.Printf("颜色 JSON: %s\n", string(colorJSON))

	var decodedColor Color
	json.Unmarshal([]byte("#FF00FF"), &decodedColor)
	fmt.Printf("解码颜色: R=%d, G=%d, B=%d, A=%d\n",
		decodedColor.Red, decodedColor.Green, decodedColor.Blue, decodedColor.Alpha)

	// ---- 5. 动态 JSON ----
	fmt.Println("\n--- 动态 JSON ---")

	jsonData := `{
		"name": "product",
		"price": 29.99,
		"tags": ["electronics", "gadget"],
		"in_stock": true,
		"metadata": {
			"weight": "0.5kg",
			"color": "black"
		}
	}`

	var result map[string]interface{}
	json.Unmarshal([]byte(jsonData), &result)

	fmt.Printf("name: %v (type: %T)\n", result["name"], result["name"])
	fmt.Printf("price: %v (type: %T)\n", result["price"], result["price"])
	fmt.Printf("in_stock: %v (type: %T)\n", result["in_stock"], result["in_stock"])
	fmt.Printf("tags: %v (type: %T)\n", result["tags"], result["tags"])

	// 访问嵌套 map
	metadata := result["metadata"].(map[string]interface{})
	fmt.Printf("metadata.weight: %s\n", metadata["weight"])

	// ---- 6. JSON Decoder（从流读取）- ----
	fmt.Println("\n--- json.Decoder 流式读取 ---")

	jsonStream := `{"name": "item1", "price": 10}
{"name": "item2", "price": 20}
{"name": "item3", "price": 30}`

	decoder := json.NewDecoder(strings.NewReader(jsonStream))
	for {
		var item Item
		if err := decoder.Decode(&item); err != nil {
			break // 读取完毕
		}
		fmt.Printf("  解码: %s, ¥%.2f\n", item.ProductName, item.Price)
	}

	// ---- 7. 文件读写 JSON ----
	fmt.Println("\n--- 文件 JSON ---")

	// 写入 JSON 到文件
	file, _ := os.Create("test_users.json")
	defer file.Close()

	users := []User{
		{ID: 1, Name: "Alice", Email: "alice@example.com"},
		{ID: 2, Name: "Bob", Email: "bob@example.com"},
	}

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	encoder.Encode(users)
	fmt.Println("JSON 写入文件成功")

	// 从文件读取 JSON
	file2, _ := os.Open("test_users.json")
	defer file2.Close()

	var loadedUsers []User
	json.NewDecoder(file2).Decode(&loadedUsers)
	fmt.Printf("从文件加载: %+v\n", loadedUsers)

	// 清理
	os.Remove("test_users.json")
	fmt.Println("  临时文件已清理")
}

// 编译运行：go run 03_json.go
