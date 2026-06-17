// ============================================================================
// 知识点: 字符串操作
//
// 说明:
// - strings 包提供了丰富的字符串处理函数
// - 字符串是不可变的字节序列, 修改会创建新字符串
// - len() 返回字节数(而非字符数), 中文字符占3个字节
// - 要正确处理 Unicode, 使用 rune 或 utf8 包
// - strconv 包用于字符串与其他类型的转换
//
// 编译和运行:
//   go run 11_strings\01_string_operations.go
// ============================================================================

package main

import (
	"fmt"
	"strings"
)

func main() {
	s := "Hello, Go语言世界!"

	// 字符串操作
	fmt.Println("原始字符串:", s)
	fmt.Println("长度(字节):", len(s))
	fmt.Println("是否包含 'Go':", strings.Contains(s, "Go"))
	fmt.Println("前缀 'Hello':", strings.HasPrefix(s, "Hello"))
	fmt.Println("后缀 '世界!':", strings.HasSuffix(s, "世界!"))
	fmt.Println("查找 '语言' 位置:", strings.Index(s, "语言"))
	fmt.Println("转大写:", strings.ToUpper(s[:5]))
	fmt.Println("重复:", strings.Repeat("Go ", 3))
	fmt.Println("替换:", strings.Replace(s, "Go", "Golang", 1))

	// 分割和连接
	parts := strings.Split("a,b,c,d", ",")
	fmt.Println("分割:", parts)
	fmt.Println("连接:", strings.Join(parts, " | "))

	// 修剪
	spaced := "  Hello, World!  "
	fmt.Printf("修剪前后: [%s] -> [%s]\n", spaced, strings.TrimSpace(spaced))

	// rune 正确处理 Unicode
	runes := []rune(s)
	fmt.Println("字符数(rune):", len(runes))
	fmt.Println("前5个字符:", string(runes[:5]))
}
