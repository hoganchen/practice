package main

import (
	"golang.org/x/tour/wc"
	"strings"
)

func WordCount(s string) map[string]int {
	retmap := make(map[string]int)
	s_fields := strings.Fields(s)

	for i := 0; i < len(s_fields); i++ {
		retmap[s_fields[i]]++
	}

	return retmap
	// return map[string]int{"x": 1}
}

/*

练习：映射

实现 WordCount。它应当返回一个映射，其中包含字符串 s 中每个“单词”的个数。函数 wc.Test 会对此函数执行一系列测试用例，并输出成功还是失败。

你会发现 strings.Fields 很有帮助。

*/
func main() {
	wc.Test(WordCount)
}
