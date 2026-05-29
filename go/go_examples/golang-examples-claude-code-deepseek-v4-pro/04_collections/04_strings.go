// ============================================================
// 知识点：字符串操作
//
// Go 字符串是不可变的字节序列（UTF-8 编码）。
// len() 返回字节数而非字符数（runecount）。
// strings 包提供丰富的字符串处理函数。
// 遍历中文字符串需要使用 for range 或 utf8 包。
// ============================================================

package main

import (
	"fmt"
	"strings"
	"unicode/utf8"
)

func main() {
	// ---- 1. 字符串基本操作 ----
	fmt.Println("--- 字符串基本操作 ---")

	str := "Hello, 世界"
	fmt.Printf("字符串: %q\n", str)
	fmt.Printf("字节长度: %d\n", len(str))           // 13
	fmt.Printf("符文数量: %d\n", utf8.RuneCountInString(str)) // 9

	// 字符串索引（按字节，不是字符）
	fmt.Printf("第一个字节: %c\n", str[0]) // 'H'

	// 字符串切片（按字节，可能截断多字节字符！）
	fmt.Println("前 5 个字节:", str[:5]) // "Hello"

	// 正确遍历字符串（按 rune）
	fmt.Println("正确遍历字符:")
	for i, r := range str {
		fmt.Printf("  pos=%d, char=%c, rune=%U\n", i, r, r)
	}

	// ---- 2. strings 包常用函数 ----
	fmt.Println("\n--- strings 包 ---")

	s := "  Go语言编程  "
	fmt.Printf("原始: %q\n", s)
	fmt.Printf("TrimSpace: %q\n", strings.TrimSpace(s))
	fmt.Printf("Trim: %q\n", strings.Trim(s, "  "))

	// 包含判断
	fmt.Println("Contains 'Go':", strings.Contains(s, "Go"))
	fmt.Println("HasPrefix '  Go':", strings.HasPrefix(s, "  Go"))
	fmt.Println("HasSuffix '编程  ':", strings.HasSuffix(s, "编程  "))

	// 大小写
	fmt.Println("ToUpper:", strings.ToUpper("hello"))
	fmt.Println("ToLower:", strings.ToLower("WORLD"))

	// 分割和连接
	phrase := "a,b,c,d"
	parts := strings.Split(phrase, ",")
	fmt.Println("Split:", parts)
	fmt.Println("Join:", strings.Join(parts, " -> "))

	// 替换
	msg := "hello hello world"
	fmt.Println("Replace:", strings.Replace(msg, "hello", "hi", 1))   // 替换 1 次
	fmt.Println("ReplaceAll:", strings.ReplaceAll(msg, "hello", "hi")) // 全部替换

	// 重复
	fmt.Println("Repeat:", strings.Repeat("Go ", 3)) // "Go Go Go "

	// ---- 3. 字符串构建（Builder） ----
	fmt.Println("\n--- strings.Builder ---")
	// strings.Builder 比 + 拼接更高效（避免多次分配内存）

	var sb strings.Builder
	sb.WriteString("Go")
	sb.WriteRune('是')
	sb.WriteString("高效的")
	sb.WriteString("语言！")
	fmt.Println("Builder 结果:", sb.String())
	fmt.Printf("Builder 长度: %d\n", sb.Len())

	// ---- 4. 字符串转换 ----
	fmt.Println("\n--- 字符串转换 ---")

	// strconv 包：字符串与数字互转
	// 需要 import "strconv"
	intStr := "42"
	// num, _ := strconv.Atoi(intStr)    // string → int
	// str := strconv.Itoa(42)            // int → string
	fmt.Printf("intStr: %s\n", intStr)

	// ---- 5. 字符串不可变性 ----
	fmt.Println("\n--- 字符串不可变 ---")
	// Go 字符串是只读的！
	// str[0] = 'h'  // 编译错误：不能修改字符串

	// 修改字符串的正确方式：转为 []rune 或 []byte
	original := "Hello"
	bytes := []byte(original)
	bytes[0] = 'h'
	modified := string(bytes)
	fmt.Printf("原字符串: %s, 修改后: %s\n", original, modified)

	// 中文字符串修改
	chinese := "世界"
	runes := []rune(chinese)
	runes[0] = '中'
	fmt.Printf("原字符串: %s, 修改后: %s\n", chinese, string(runes))
}

// 编译运行：go run 04_strings.go
