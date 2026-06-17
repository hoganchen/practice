// ============================================================================
// 知识点: JSON 流式编码与解码
//
// 说明:
// - json.NewEncoder / json.NewDecoder 实现流式 JSON 处理
// - 适用于处理大文件或网络流, 避免一次性加载整个数据
// - Decoder 从 io.Reader 读取并解析 JSON
// - Encoder 将数据编码为 JSON 写入 io.Writer
// - 支持自定义的 MarshalJSON / UnmarshalJSON 方法
//
// 编译和运行:
//   go run 30_json\01_json_encoder_decoder.go
// ============================================================================

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"
)

type Product struct {
	ID    int     `json:"id"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
}

func main() {
	// 流式解码
	jsonStream := `{"id":1,"name":"手机","price":3999.00}
{"id":2,"name":"电脑","price":8999.00}
{"id":3,"name":"耳机","price":299.00}`

	decoder := json.NewDecoder(strings.NewReader(jsonStream))
	fmt.Println("流式解码:")
	for {
		var p Product
		err := decoder.Decode(&p)
		if err != nil {
			break
		}
		fmt.Printf("  %+v\n", p)
	}

	// 流式编码
	var buf bytes.Buffer
	encoder := json.NewEncoder(&buf)
	encoder.SetIndent("", "  ")

	products := []Product{
		{ID: 4, Name: "平板", Price: 4999.00},
		{ID: 5, Name: "手表", Price: 1999.00},
	}

	for _, p := range products {
		encoder.Encode(p)
	}
	fmt.Println("\n流式编码结果:")
	fmt.Println(buf.String())
}
