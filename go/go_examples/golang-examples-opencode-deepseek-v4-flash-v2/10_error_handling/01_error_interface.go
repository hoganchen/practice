// ============================================================================
// 知识点: error 接口
//
// 说明:
// - error 是Go内置接口: type error interface { Error() string }
// - 函数通常返回 error 作为最后一个返回值
// - 调用者需要检查 error 是否为 nil
// - 标准库提供 errors.New() 和 fmt.Errorf() 创建错误
// - Go 1.13+ 支持错误链: errors.Is, errors.As
//
// 编译和运行:
//   go run 10_error_handling\01_error_interface.go
// ============================================================================

package main

import (
	"errors"
	"fmt"
	"os"
)

func readFile(filename string) (string, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return "", fmt.Errorf("读取文件 %s 失败: %w", filename, err)
	}
	return string(data), nil
}

func main() {
	// 创建错误
	err1 := errors.New("这是一个错误")
	err2 := fmt.Errorf("包装错误: %w", err1)
	fmt.Println("err1:", err1)
	fmt.Println("err2:", err2)

	// 检查错误链
	if errors.Is(err2, err1) {
		fmt.Println("err2 包含 err1")
	}

	// 读取不存在的文件
	_, err := readFile("nonexistent.txt")
	if err != nil {
		fmt.Println("错误:", err)
		if errors.Is(err, os.ErrNotExist) {
			fmt.Println("  -> 文件不存在!")
		}
	}
}
