// ============================================================================
// 知识点: Hex 编码 (encoding/hex)
//
// 说明:
// - encoding/hex 提供十六进制编解码
// - hex.EncodeToString / hex.DecodeString
// - hex.Dumper 用于创建十六进制转储
// - 常用于: 哈希值展示、二进制数据可读化
//
// 编译和运行:
//   go run 21_encoding\02_hex.go
// ============================================================================

package main

import (
	"encoding/hex"
	"fmt"
)

func main() {
	data := []byte("Hello, 十六进制编码!")

	// 编码为十六进制字符串
	encoded := hex.EncodeToString(data)
	fmt.Println("Hex 编码:", encoded)

	// 解码
	decoded, err := hex.DecodeString(encoded)
	if err != nil {
		fmt.Println("解码失败:", err)
		return
	}
	fmt.Println("解码结果:", string(decoded))

	// 格式化的 Hex 输出 (每16字节一行)
	fmt.Println("\nHex 转储:")
	dumper := hex.Dumper(nil)
	dumper.Write(data)
	dumper.Close()

	// 处理哈希值
	hash := []byte{0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89}
	hashStr := hex.EncodeToString(hash)
	fmt.Println("\n哈希值:", hashStr)
	fmt.Println("大写:", fmt.Sprintf("%X", hash))
}
