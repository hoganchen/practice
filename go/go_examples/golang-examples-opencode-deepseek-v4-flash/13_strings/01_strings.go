// ============================================================
// 知识点：字符串操作
//
// Go 字符串是不可变的字节序列，支持 UTF-8 编码。
// strings 包提供了丰富的字符串操作函数。
// 使用 rune 处理 Unicode 字符（如中文）。
//
// 编译运行方法：
//   go run 01_strings.go
// ============================================================

package main

import (
	"fmt"
	"strings"
)

func main() {
	// -------- 字符串基础操作 --------
	s := "Hello, Go语言!"

	fmt.Println("原始字符串:", s)
	fmt.Println("长度（字节）:", len(s))           // 字节数
	fmt.Println("取子串:", s[0:5])                 // "Hello"

	// -------- 遍历字符串（byte vs rune）--------
	fmt.Println("\n=== 按字节遍历 ===")
	for i := 0; i < len(s); i++ {
		fmt.Printf("%x ", s[i]) // 输出十六进制字节
	}
	fmt.Println()

	fmt.Println("=== 按 rune 遍历 ===")
	for i, r := range s {
		fmt.Printf("位置 %d: %c (Unicode: %U)\n", i, r, r)
	}

	// -------- strings 包常用函数 --------
	fmt.Println("\n=== strings 包函数 ===")
	str := "  Go语言编程  "

	fmt.Println("Trim去空格:", strings.TrimSpace(str))
	fmt.Println("Trim前缀:", strings.TrimPrefix(str, "  Go"))
	fmt.Println("ToUpper:", strings.ToUpper("hello"))
	fmt.Println("ToLower:", strings.ToLower("WORLD"))
	fmt.Println("HasPrefix:", strings.HasPrefix("golang.txt", "go"))
	fmt.Println("HasSuffix:", strings.HasSuffix("golang.txt", ".txt"))
	fmt.Println("Contains:", strings.Contains("hello world", "world"))
	fmt.Println("Count:", strings.Count("banana", "na"))

	// 分割与连接
	parts := strings.Split("a,b,c,d", ",")
	fmt.Println("Split:", parts)
	fmt.Println("Join:", strings.Join(parts, "|"))

	// 替换
	fmt.Println("Replace:", strings.Replace("hello hello", "hello", "hi", 1))       // 替换1次
	fmt.Println("ReplaceAll:", strings.ReplaceAll("hello hello", "hello", "hi"))    // 全部替换

	// -------- 字符串与整数互转 --------
	fmt.Println("\n=== 字符串/整数互转 ===")
	fmt.Println("strconv相关函数在 strconv 包中")

	// -------- 字符串构建（strings.Builder）--------
	fmt.Println("\n=== strings.Builder ===")
	var builder strings.Builder
	builder.WriteString("Hello")
	builder.WriteString(" ")
	builder.WriteString("World")
	builder.WriteRune('!')
	fmt.Println("Builder结果:", builder.String())
	fmt.Println("Builder长度:", builder.Len())
}
