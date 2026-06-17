// ============================================================================
// 知识点: bufio 缓冲读写
//
// 说明:
// - bufio 包提供带缓冲的 I/O 操作, 减少系统调用次数
// - bufio.Scanner 方便地按行读取文本
// - bufio.Reader / bufio.Writer 提供更细粒度的缓冲控制
// - 默认 Scanner 最大行长度为 64KB, 过长可用 bufio.ReadLine
//
// 编译和运行:
//   go run 14_file_io\02_bufio_scan.go
// ============================================================================

package main

import (
	"bufio"
	"fmt"
	"strings"
)

func main() {
	// 模拟多行文本
	input := "第一行\n第二行\n第三行\n第四行\n"

	// 使用 bufio.Scanner 按行读取
	scanner := bufio.NewScanner(strings.NewReader(input))
	lineNum := 1
	for scanner.Scan() {
		fmt.Printf("行 %d: %s\n", lineNum, scanner.Text())
		lineNum++
	}

	if err := scanner.Err(); err != nil {
		fmt.Println("扫描错误:", err)
	}

	// 使用 bufio.Writer 写入
	var sb strings.Builder
	writer := bufio.NewWriter(&sb)
	writer.WriteString("Hello, ")
	writer.WriteString("Buffered ")
	writer.WriteString("World!")
	writer.Flush() // 刷新缓冲区

	fmt.Println("写入结果:", sb.String())
}
