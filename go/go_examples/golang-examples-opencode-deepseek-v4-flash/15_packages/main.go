// ============================================================
// 知识点：包管理
//
// Go 程序由包组成，main 包是程序的入口。
// 使用 import 导入其他包。
// 标准库包和自定义包的导入方式。
// 使用 go mod init 初始化模块。
//
// 编译运行方法：
//   go mod init examples
//   go run main.go
// ============================================================

package main

import (
	"fmt"

	"examples/mypackage"
)

func main() {
	// -------- 使用自定义包 --------
	fmt.Println("=== 使用自定义包 ===")

	// 调用导出函数
	msg := mypackage.ExportedFunc("张三")
	fmt.Println(msg)

	// 使用导出结构体
	calc := mypackage.Calculator{Name: "计算器"}
	result := calc.Add(10, 20)
	fmt.Printf("10 + 20 = %d\n", result)

	// 调用内部函数（通过导出函数间接调用）
	internalMsg := mypackage.CallInternal()
	fmt.Println(internalMsg)
}
