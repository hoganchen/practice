// ============================================================================
// 知识点: Hello World - Go语言入门程序
//
// 说明:
// - Go程序由包(package)组成, main包是程序的入口包
// - main函数是程序的执行入口, 每个可执行程序必须有且仅有一个main函数
// - import关键字用于导入标准库或其他包
// - fmt包提供了格式化输入输出的功能
//
// 编译和运行:
//   go run 01_hello_world\01_hello_world.go
//   go build -o hello.exe 01_hello_world\01_hello_world.go && .\hello.exe
// ============================================================================

package main

import "fmt"

func main() {
	fmt.Println("Hello, World!")
	fmt.Println("欢迎学习 Go 语言!")
}
