// ============================================================================
// 知识点: 文件读写 (os 和 io 包)
//
// 说明:
// - os.ReadFile / os.WriteFile 用于一次性读写整个文件 (Go 1.16+)
// - os.Open / os.Create 返回文件指针, 用于流式读写
// - 使用 defer f.Close() 确保文件关闭
// - ioutil 包在 Go 1.16+ 已废弃, 功能迁移到 os 和 io 包
//
// 编译和运行:
//   go run 14_file_io\01_read_write_file.go
// ============================================================================

package main

import (
	"fmt"
	"os"
)

func main() {
	content := "Hello, Go 文件操作!\n这是第二行内容。\n"

	// 写入文件
	err := os.WriteFile("example.txt", []byte(content), 0644)
	if err != nil {
		fmt.Println("写入失败:", err)
		return
	}
	fmt.Println("文件写入成功")

	// 读取文件
	data, err := os.ReadFile("example.txt")
	if err != nil {
		fmt.Println("读取失败:", err)
		return
	}
	fmt.Println("文件内容:")
	fmt.Println(string(data))

	// 追加写入
	f, err := os.OpenFile("example.txt", os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("打开文件失败:", err)
		return
	}
	defer f.Close()

	_, err = f.WriteString("追加的内容。\n")
	if err != nil {
		fmt.Println("追加失败:", err)
		return
	}
	fmt.Println("追加成功")

	// 读取验证
	data, _ = os.ReadFile("example.txt")
	fmt.Println("最终内容:")
	fmt.Println(string(data))

	// 清理
	os.Remove("example.txt")
}
