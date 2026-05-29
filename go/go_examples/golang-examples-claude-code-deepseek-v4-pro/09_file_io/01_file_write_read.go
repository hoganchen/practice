// ============================================================
// 知识点：文件读写（os 包）
//
// Go 提供了简单易用的文件操作 API。
// os.ReadFile / os.WriteFile 适合小文件（一次性读写）。
// os.Open / os.Create + 手动读写适合大文件。
// 始终使用 defer 关闭文件。
// ============================================================

package main

import (
	"fmt"
	"os"
)

func main() {
	// ---- 1. 写入文件（一次性） ----
	fmt.Println("--- 一次性写入 ---")

	content := []byte("Hello, Go 文件操作！\n这是第二行。\n")
	err := os.WriteFile("test_output.txt", content, 0644)
	if err != nil {
		fmt.Println("写入失败:", err)
		return
	}
	fmt.Println("文件写入成功")

	// ---- 2. 读取文件（一次性） ----
	fmt.Println("\n--- 一次性读取 ---")

	data, err := os.ReadFile("test_output.txt")
	if err != nil {
		fmt.Println("读取失败:", err)
		return
	}
	fmt.Printf("文件内容:\n%s", string(data))

	// ---- 3. 使用 os.Open / os.Create（手动操作） ----
	fmt.Println("\n--- 使用 os.Create 写入 ---")

	file, err := os.Create("test_manual.txt")
	if err != nil {
		fmt.Println("创建失败:", err)
		return
	}
	defer file.Close() // 确保关闭

	bytesWritten, err := file.WriteString("手动写入的文本\n")
	if err != nil {
		fmt.Println("写入失败:", err)
		return
	}
	fmt.Printf("写入 %d 字节\n", bytesWritten)

	// ---- 4. 使用 os.Open 读取 ----
	fmt.Println("\n--- 使用 os.Open 读取 ---")

	file2, err := os.Open("test_manual.txt")
	if err != nil {
		fmt.Println("打开失败:", err)
		return
	}
	defer file2.Close()

	buf := make([]byte, 1024)
	n, err := file2.Read(buf)
	if err != nil {
		fmt.Println("读取失败:", err)
		return
	}
	fmt.Printf("读取了 %d 字节: %s\n", n, string(buf[:n]))

	// ---- 5. 追加写入 ----
	fmt.Println("\n--- 追加写入 ---")

	file3, err := os.OpenFile("test_output.txt",
		os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("打开失败:", err)
		return
	}
	defer file3.Close()

	_, err = file3.WriteString("追加的内容！\n")
	if err != nil {
		fmt.Println("追加失败:", err)
		return
	}
	fmt.Println("追加成功")

	// ---- 6. 文件信息 ----
	fmt.Println("\n--- 文件信息 ---")

	info, err := os.Stat("test_output.txt")
	if err != nil {
		fmt.Println("获取文件信息失败:", err)
		return
	}

	fmt.Printf("文件名: %s\n", info.Name())
	fmt.Printf("大小: %d 字节\n", info.Size())
	fmt.Printf("权限: %v\n", info.Mode())
	fmt.Printf("修改时间: %v\n", info.ModTime())
	fmt.Printf("是目录: %t\n", info.IsDir())

	// ---- 7. 目录操作 ----
	fmt.Println("\n--- 目录操作 ---")

	// 创建目录
	err = os.MkdirAll("test_dir/sub_dir", 0755)
	if err != nil {
		fmt.Println("创建目录失败:", err)
		return
	}
	fmt.Println("目录创建成功")

	// 读取目录
	entries, err := os.ReadDir(".")
	if err != nil {
		fmt.Println("读取目录失败:", err)
		return
	}
	fmt.Println("当前目录下的文件和目录:")
	for _, entry := range entries {
		fmt.Printf("  [%s] %s\n", entry.Type().String(), entry.Name())
	}

	// ---- 8. 临时文件 ----
	fmt.Println("\n--- 临时文件与目录 ---")

	tmpFile, err := os.CreateTemp("", "example_*.txt")
	if err != nil {
		fmt.Println("创建临时文件失败:", err)
		return
	}
	fmt.Printf("临时文件: %s\n", tmpFile.Name())
	tmpFile.WriteString("临时数据")
	tmpFile.Close()
	os.Remove(tmpFile.Name()) // 清理
	fmt.Println("临时文件已清理")

	// ---- 9. 检查文件是否存在 ----
	fmt.Println("\n--- 检查文件存在 ---")
	checkFileExists := func(path string) {
		if _, err := os.Stat(path); os.IsNotExist(err) {
			fmt.Printf("  %s 不存在\n", path)
		} else if err != nil {
			fmt.Printf("  %s 检查出错: %v\n", path, err)
		} else {
			fmt.Printf("  %s 存在\n", path)
		}
	}
	checkFileExists("test_output.txt")
	checkFileExists("not_exist.txt")

	// ---- 清理 ----
	os.Remove("test_output.txt")
	os.Remove("test_manual.txt")
	os.RemoveAll("test_dir")
	fmt.Println("\n  临时测试文件已清理")
}

// 编译运行：go run 01_file_write_read.go
