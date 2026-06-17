// ============================================================================
// 知识点: goto 跳转语句
//
// 说明:
// - goto 跳转到当前函数内的标签处继续执行
// - 标签使用 标签名: 定义
// - goto 不能跳转到其他函数或跳过变量声明
// - 在 Go 中 goto 使用较少, 但适用于深层嵌套的跳出
// - 常用于错误处理或退出多层循环
//
// 编译和运行:
//   go run 04_control_flow\04_goto.go
// ============================================================================

package main

import "fmt"

func main() {
	// goto 跳出多层循环
	fmt.Println("使用 goto 跳出多层循环:")
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if i == 1 && j == 1 {
				goto found
			}
			fmt.Printf("  (%d, %d)", i, j)
		}
		fmt.Println()
	}

found:
	fmt.Println("\n找到目标, 跳出循环")

	// goto 用于错误处理
	fmt.Println("\n使用 goto 处理错误:")
	err := doWork()
	if err != nil {
		goto cleanup
	}
	fmt.Println("  work 完成")

cleanup:
	fmt.Println("  执行清理操作")
}

func doWork() error {
	return nil
}
