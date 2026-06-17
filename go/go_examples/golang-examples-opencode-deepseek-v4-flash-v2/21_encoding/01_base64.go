// ============================================================================
// 知识点: Base64 编码
//
// 说明:
// - encoding/base64 提供 Base64 编码解码功能
// - 支持标准 Base64 和 URL 安全的 Base64
// - URL 安全版本将 +/ 替换为 -_, 适合 URL 传输
// - Raw 版本不包含填充的 =
//
// 编译和运行:
//   go run 21_encoding\01_base64.go
// ============================================================================

package main

import (
	"encoding/base64"
	"fmt"
)

func main() {
	data := []byte("Hello, Go语言! Base64 编码示例.")

	// 标准 Base64
	encoded := base64.StdEncoding.EncodeToString(data)
	fmt.Println("标准 Base64 编码:", encoded)

	decoded, _ := base64.StdEncoding.DecodeString(encoded)
	fmt.Println("解码结果:", string(decoded))

	// URL 安全的 Base64
	urlEncoded := base64.URLEncoding.EncodeToString(data)
	fmt.Println("URL 安全编码:", urlEncoded)

	urlDecoded, _ := base64.URLEncoding.DecodeString(urlEncoded)
	fmt.Println("URL 解码结果:", string(urlDecoded))

	// Raw 标准 (无填充)
	rawEncoded := base64.RawStdEncoding.EncodeToString(data)
	fmt.Println("Raw 编码 (无填充):", rawEncoded)

	// Base64 编码图片数据 (常见用途)
	imageData := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
	imgBase64 := base64.StdEncoding.EncodeToString(imageData)
	fmt.Println("PNG 文件头 Base64:", imgBase64)
}
