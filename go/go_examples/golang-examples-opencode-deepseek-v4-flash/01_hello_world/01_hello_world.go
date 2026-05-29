// ============================================================
// 知识点：Hello World — Go 语言的入口程序
//
// 这是 Go 语言中最基本的程序，演示了：
// 1. 包声明（package main）
// 2. 导入标准库（import "fmt"）
// 3. main 函数作为程序入口
// 4. 使用 fmt.Println 输出文本
//
// 编译运行方法：
//   go run 01_hello_world.go
// 或先编译再运行：
//   go build -o hello.exe 01_hello_world.go
//   ./hello.exe
// ============================================================

package main

import "fmt"

// main 函数是 Go 程序的唯一入口，不接受参数，没有返回值
func main() {
	// fmt.Println 向标准输出打印一行文本并自动换行
	fmt.Println("Hello, Go 语言!")

	// 也可以使用 Printf 进行格式化输出
	name := "Golang"
	fmt.Printf("你好，%s！\n", name)
}
