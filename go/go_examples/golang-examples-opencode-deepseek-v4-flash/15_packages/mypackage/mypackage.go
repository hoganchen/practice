// ============================================================
// 知识点：自定义包（mypackage）
//
// 这是 15_packages 示例的辅助包。
// 包名 = 目录名，一个目录下的所有 .go 文件必须属于同一包。
// 首字母大写的函数/变量可被外部访问（导出）。
// 首字母小写的仅包内可见（非导出）。
//
// 编译运行方法：
//   从 15_packages 目录编译：
//   go run main.go
// ============================================================

package mypackage

import "fmt"

// ExportedFunc 是导出的函数（首字母大写）
// 可以被其他包调用
func ExportedFunc(name string) string {
	return fmt.Sprintf("你好，%s！这是 mypackage 的导出函数。", name)
}

// unexportedFunc 是非导出函数（首字母小写）
// 只能在包内部使用
func unexportedFunc() string {
	return "这是非导出函数，外部不可见"
}

// Calculator 是导出的结构体
type Calculator struct {
	Name string
}

// Add 是 Calculator 的导出方法
func (c Calculator) Add(a, b int) int {
	return a + b
}

// multiply 是非导出的方法
func (c Calculator) multiply(a, b int) int {
	return a * b
}

// CallInternal 调用内部函数演示
func CallInternal() string {
	return unexportedFunc()
}
