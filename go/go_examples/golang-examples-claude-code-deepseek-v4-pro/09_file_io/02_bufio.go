// ============================================================
// 知识点：带缓冲的 I/O（bufio 包）
//
// bufio 提供带缓冲的读写操作，减少系统调用次数。
// Scanner 是最简洁的按行读取方式。
// Writer 提供带缓冲的写入，Flush 将缓冲数据写入底层。
// 适用于大文件处理和网络数据流。
// ============================================================

package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	// ---- 1. bufio.Scanner — 按行读取 ----
	fmt.Println("--- 按行读取 ---")

	// 准备测试数据
	input := "第一行\n第二行\n第三行\n第四行\n"
	scanner := bufio.NewScanner(strings.NewReader(input))

	lineNum := 0
	for scanner.Scan() {
		lineNum++
		fmt.Printf("  行 %d: %s\n", lineNum, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		fmt.Println("扫描错误:", err)
	}
	fmt.Printf("  共读取 %d 行\n", lineNum)

	// ---- 2. 按单词读取 ----
	fmt.Println("\n--- 按单词读取 ---")

	sentence := "Go is a compiled, statically typed programming language"
	wordScanner := bufio.NewScanner(strings.NewReader(sentence))
	wordScanner.Split(bufio.ScanWords) // 设置按单词分割

	wordCount := 0
	for wordScanner.Scan() {
		wordCount++
		fmt.Printf("  单词 %d: %s\n", wordCount, wordScanner.Text())
	}
	fmt.Printf("  共 %d 个单词\n", wordCount)

	// ---- 3. bufio.Writer — 带缓冲写入 ----
	fmt.Println("\n--- 带缓冲写入 ---")

	file, err := os.Create("test_bufio.txt")
	if err != nil {
		fmt.Println("创建文件失败:", err)
		return
	}
	defer file.Close()

	writer := bufio.NewWriter(file)

	// 写入多行（先在内存缓冲）
	for i := 1; i <= 1000; i++ {
		_, err := writer.WriteString(fmt.Sprintf("Line %d: 这是测试数据\n", i))
		if err != nil {
			fmt.Println("写入错误:", err)
			return
		}
	}

	// 重要：Flush 将缓冲数据真正写入文件
	err = writer.Flush()
	if err != nil {
		fmt.Println("Flush 错误:", err)
		return
	}
	fmt.Println("  1000 行写入成功（带缓冲）")

	// ---- 4. Scanner 读取实际文件 ----
	fmt.Println("\n--- 读取实际文件 ---")

	file2, err := os.Open("test_bufio.txt")
	if err != nil {
		fmt.Println("打开失败:", err)
		return
	}
	defer file2.Close()

	fileScanner := bufio.NewScanner(file2)
	count := 0
	for fileScanner.Scan() && count < 5 { // 只读前 5 行
		count++
		fmt.Printf("  第 %d 行: %s\n", count, fileScanner.Text())
	}
	fmt.Println("  ...（只展示了前 5 行）")

	// ---- 5. 带缓冲读取（Reader）----
	fmt.Println("\n--- bufio.Reader 用法 ---")

	file3, _ := os.Open("test_bufio.txt")
	defer file3.Close()

	reader := bufio.NewReader(file3)

	// 读取直到分隔符
	line, err := reader.ReadString('\n')
	if err != nil {
		fmt.Println("读取错误:", err)
	} else {
		fmt.Printf("  ReadString 结果: %s", line)
	}

	// Peek 查看后续数据但不移动指针
	peekData, _ := reader.Peek(10)
	fmt.Printf("  Peek 后续 10 字节: %s\n", string(peekData))

	// ---- 6. 自定义分割函数 ----
	fmt.Println("\n--- 自定义分割 ---")

	csvData := "a,b,c,d,e"
	csvScanner := bufio.NewScanner(strings.NewReader(csvData))
	csvScanner.Split(func(data []byte, atEOF bool) (advance int, token []byte, err error) {
		for i := 0; i < len(data); i++ {
			if data[i] == ',' {
				return i + 1, data[:i], nil
			}
		}
		if atEOF && len(data) > 0 {
			return len(data), data, nil
		}
		return 0, nil, nil
	})

	for csvScanner.Scan() {
		fmt.Printf("  CSV 字段: %s\n", csvScanner.Text())
	}

	// ---- 清理 ----
	os.Remove("test_bufio.txt")
	fmt.Println("\n  临时文件已清理")
}

// 编译运行：go run 02_bufio.go
