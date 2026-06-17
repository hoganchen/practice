// ============================================================================
// 知识点: 常量声明
//
// 说明:
// - const 关键字用于声明常量, 常量在编译时确定, 不可修改
// - 常量可以用作枚举, 配合 iota 实现自增
// - iota 在 const 块中每行递增, 常用于枚举场景
// - 常量可以是无类型常量, 在需要时自动转换
//
// 编译和运行:
//   go run 02_variables\02_constants.go
// ============================================================================

package main

import "fmt"

const Pi = 3.14159

// iota 实现枚举常量
const (
	StatusOK    = iota // 0
	StatusWarn         // 1
	StatusError        // 2
)

const (
	_  = iota             // 忽略 0
	KB = 1 << (10 * iota) // 1 << 10 = 1024
	MB                    // 1 << 20
	GB                    // 1 << 30
)

func main() {
	fmt.Println("圆周率:", Pi)
	fmt.Println("状态 - 正常:", StatusOK, "警告:", StatusWarn, "错误:", StatusError)
	fmt.Println("存储单位 - KB:", KB, "MB:", MB, "GB:", GB)
}
