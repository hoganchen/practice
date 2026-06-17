// ============================================================================
// 知识点: 变量声明
//
// 说明:
// - Go是强类型语言, 变量声明时需要指定类型或使用短变量声明自动推导
// - var 关键字用于声明变量, 格式: var 变量名 类型 = 值
// - 短变量声明 := 用于在函数内部声明并初始化变量, 自动推导类型
// - 多个变量可以在一行中同时声明
// - Go中声明而未使用的变量会导致编译错误
//
// 编译和运行:
//   go run 02_variables\01_variable_declaration.go
// ============================================================================

package main

import "fmt"

func main() {
	// var 声明变量
	var name string = "Go"
	var version = 1.25

	// 短变量声明 (只能在函数内部使用)
	year := 2025

	// 多变量同时声明
	var x, y int = 10, 20

	// 先声明后赋值
	var message string
	message = "Hello, Go!"

	fmt.Println("语言:", name)
	fmt.Println("版本:", version)
	fmt.Println("年份:", year)
	fmt.Println("坐标:", x, y)
	fmt.Println("消息:", message)
}
