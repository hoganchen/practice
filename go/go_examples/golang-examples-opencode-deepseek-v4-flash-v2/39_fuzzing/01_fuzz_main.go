// ============================================================================
// 知识点: Fuzz 测试 (Fuzzing, Go 1.18+)
//
// 说明:
// - fuzz 测试自动生成随机输入来发现边界情况和漏洞
// - Fuzz 函数命名: FuzzXxx(f *testing.F)
// - f.Add 添加种子语料库
// - f.Fuzz 启动 fuzz 测试, 传入目标函数
// - 运行: go test -fuzz=Fuzz -fuzztime=10s
// - 使用 -fuzz 参数运行, 默认不会执行 fuzz (仅执行种子)
//
// 编译和运行 (普通测试):
//   go test ./39_fuzzing/ -v
//
// Fuzz 测试:
//   go test ./39_fuzzing/ -fuzz=FuzzReverse -fuzztime=5s
// ============================================================================

package main

import (
	"errors"
	"fmt"
	"unicode/utf8"
)

func Reverse(s string) (string, error) {
	if !utf8.ValidString(s) {
		return s, errors.New("输入不是有效的 UTF-8 字符串")
	}
	runes := []rune(s)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes), nil
}

func main() {
	testCases := []string{"Hello, World!", "Go语言", "12345"}
	for _, s := range testCases {
		reversed, err := Reverse(s)
		if err != nil {
			fmt.Printf("Reverse(%q) 错误: %v\n", s, err)
		} else {
			fmt.Printf("Reverse(%q) = %q\n", s, reversed)
		}
	}
}
