// ============================================================
// 知识点：错误处理（Error Handling）
//
// Go 通过返回 error 接口值（而非异常）来处理错误。
// error 是内置接口：type error interface { Error() string }
// 约定：函数最后一个返回值是 error 类型。
// 调用者必须检查错误（使用 if err != nil）。
//
// 编译运行方法：
//   go run 01_errors.go
// ============================================================

package main

import (
	"fmt"
	"os"
	"strconv"
)

// -------- 返回 error 的函数 --------
func divide(a, b float64) (float64, error) {
	if b == 0 {
		// 使用 fmt.Errorf 创建错误（格式化错误信息）
		return 0, fmt.Errorf("不能除以零：%.2f / %.2f", a, b)
	}
	return a / b, nil // 成功时返回 nil
}

// -------- 打开文件时错误的处理 --------
func readConfig(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		// 使用 fmt.Errorf + %w 包装错误（错误链）
		return "", fmt.Errorf("读取配置文件失败: %w", err)
	}
	return string(data), nil
}

func main() {
	// -------- 基本错误处理模式 --------
	fmt.Println("=== 基本错误处理 ===")
	result, err := divide(10, 2)
	if err != nil {
		fmt.Println("错误:", err)
	} else {
		fmt.Println("结果:", result)
	}

	result, err = divide(10, 0)
	if err != nil {
		fmt.Println("错误:", err)
	} else {
		fmt.Println("结果:", result)
	}

	// -------- strconv 的错误处理 --------
	fmt.Println("\n=== 类型转换错误 ===")
	num, err := strconv.Atoi("42")
	if err != nil {
		fmt.Println("转换失败:", err)
	} else {
		fmt.Println("转换成功:", num)
	}

	num, err = strconv.Atoi("不是数字")
	if err != nil {
		fmt.Println("转换失败:", err) // 期望的错误
	}

	// -------- 错误包装与 unwrap --------
	fmt.Println("\n=== 错误链 ===")
	_, err = readConfig("不存在的文件.txt")
	if err != nil {
		fmt.Println("完整错误:", err)

		// errors.Is 检查错误链中是否包含特定错误
		if os.IsNotExist(err) {
			fmt.Println("底层原因：文件不存在")
		}
	}
}
