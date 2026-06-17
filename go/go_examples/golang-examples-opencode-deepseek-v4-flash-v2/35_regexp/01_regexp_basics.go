// ============================================================================
// 知识点: regexp 正则表达式
//
// 说明:
// - regexp 包提供正则表达式功能, 采用 RE2 语法
// - regexp.Compile 编译正则 (返回 error), regexp.MustCompile (panic)
// - MatchString / FindString / FindAllString / FindStringSubmatch
// - ReplaceAllString / Split
// - 为了提高性能, 应复用编译后的 *Regexp 对象
//
// 编译和运行:
//   go run 35_regexp\01_regexp_basics.go
// ============================================================================

package main

import (
	"fmt"
	"regexp"
)

func main() {
	// 基本匹配
	matched, _ := regexp.MatchString("^Hello", "Hello, World!")
	fmt.Println("匹配 '^Hello':", matched)

	// 编译正则
	emailPattern := regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`)

	text := "联系邮箱: alice@example.com, bob@test.org.cn, 或 support@go.dev"

	// 查找第一个匹配
	email := emailPattern.FindString(text)
	fmt.Println("第一个邮箱:", email)

	// 查找所有匹配
	allEmails := emailPattern.FindAllString(text, -1)
	fmt.Println("所有邮箱:", allEmails)

	// 提取子匹配 (分组)
	logPattern := regexp.MustCompile(`(\d{4}-\d{2}-\d{2}) (\w+) (.*)`)
	logLine := "2025-06-17 ERROR 数据库连接超时"
	matches := logPattern.FindStringSubmatch(logLine)
	fmt.Printf("日志解析: 日期=%s, 级别=%s, 消息=%s\n", matches[1], matches[2], matches[3])

	// 替换
	phonePattern := regexp.MustCompile(`\d{3}-\d{4}-\d{4}`)
	masked := phonePattern.ReplaceAllString("联系方式: 138-1234-5678", "***-****-****")
	fmt.Println("脱敏后:", masked)

	// 分割
	splitPattern := regexp.MustCompile(`[,\s;]+`)
	parts := splitPattern.Split("a,b c;d e", -1)
	fmt.Println("分割结果:", parts)
}
