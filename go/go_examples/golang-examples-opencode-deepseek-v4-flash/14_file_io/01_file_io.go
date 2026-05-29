// ============================================================
// 知识点：文件读写（File I/O）
//
// os 包提供文件操作的基本功能。
// io 和 bufio 包提供更高级的 I/O 功能。
// 常用模式：打开 → 操作 → 延迟关闭（defer Close()）
//
// 编译运行方法：
//   go run 01_file_io.go
// ============================================================

package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	// 临时文件路径
	tmpDir := os.TempDir()
	filePath := filepath.Join(tmpDir, "go_example_temp.txt")

	// -------- 写入文件（整个文件）--------
	fmt.Println("=== 写入文件 ===")
	content := "Hello, Go文件操作!\n这是第二行。\n这是第三行。\n"
	err := os.WriteFile(filePath, []byte(content), 0644)
	if err != nil {
		fmt.Println("写入失败:", err)
		return
	}
	fmt.Println("写入成功:", filePath)

	// -------- 读取文件（整个文件）--------
	fmt.Println("\n=== 读取文件 ===")
	data, err := os.ReadFile(filePath)
	if err != nil {
		fmt.Println("读取失败:", err)
		return
	}
	fmt.Println("文件内容:")
	fmt.Println(string(data))

	// -------- 逐行读取（bufio.Scanner）--------
	fmt.Println("\n=== 逐行读取 ===")
	file, err := os.Open(filePath)
	if err != nil {
		fmt.Println("打开失败:", err)
		return
	}
	defer file.Close() // 确保关闭

	scanner := bufio.NewScanner(file)
	lineNum := 1
	for scanner.Scan() {
		fmt.Printf("第 %d 行: %s\n", lineNum, scanner.Text())
		lineNum++
	}
	if err := scanner.Err(); err != nil {
		fmt.Println("读取错误:", err)
	}

	// -------- 追加写入（os.OpenFile）--------
	fmt.Println("\n=== 追加写入 ===")
	f, err := os.OpenFile(filePath, os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("打开失败:", err)
		return
	}
	defer f.Close()

	_, err = f.WriteString("这是追加的内容。\n")
	if err != nil {
		fmt.Println("追加失败:", err)
		return
	}
	fmt.Println("追加成功！")

	// 读取验证
	data, _ = os.ReadFile(filePath)
	fmt.Println("最终文件内容:\n", string(data))

	// -------- 清理临时文件 --------
	os.Remove(filePath)
	fmt.Println("\n临时文件已删除")
}
