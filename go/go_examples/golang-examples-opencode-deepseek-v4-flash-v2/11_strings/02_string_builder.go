// ============================================================================
// 知识点: strings.Builder 高效字符串拼接
//
// 说明:
// - 使用 + 拼接大量字符串会产生很多临时对象, 性能差
// - strings.Builder 通过内部缓冲区高效构建字符串
// - strings.Builder 的 WriteString 方法返回 error, 但总是 nil
// - 预分配容量 Grow(n) 可以进一步提升性能
// - 在热路径中频繁拼接字符串时优先使用 Builder
//
// 编译和运行:
//   go run 11_strings\02_string_builder.go
// ============================================================================

package main

import (
	"fmt"
	"strings"
)

func buildString(items []string) string {
	var builder strings.Builder

	// 预估总长度, 减少扩容
	totalLen := len(items) - 1 // 分隔符长度
	for _, item := range items {
		totalLen += len(item)
	}
	builder.Grow(totalLen)

	for i, item := range items {
		if i > 0 {
			builder.WriteString(", ")
		}
		builder.WriteString(item)
	}
	return builder.String()
}

func main() {
	fruits := []string{"苹果", "香蕉", "橙子", "葡萄", "西瓜", "草莓"}
	result := buildString(fruits)
	fmt.Println("拼接结果:", result)
	fmt.Println("长度:", len(result))

	// 重置 Builder 复用
	var sb strings.Builder
	for i := 0; i < 5; i++ {
		sb.Reset()
		sb.WriteString("计数: ")
		sb.WriteString(fmt.Sprint(i))
		fmt.Println(sb.String())
	}
}
