// ============================================================
// 知识点：Hello World — Go 程序的最小结构
//
// 每个 Go 程序由包（package）声明开始。
// package main 定义可独立运行的程序，必须包含 main() 函数作为入口。
// ============================================================

// package 声明：每个 .go 文件都属于某个包
package main

// import 导入标准库或第三方包
// "fmt" 是标准库中最常用的格式化 I/O 包
import "fmt"

// main 函数是程序的入口，自动执行
func main() {
	// Println 在标准输出打印一行文本并自动换行
	fmt.Println("Hello, Go 语言!")

	// Printf 支持格式化占位符
	// %s 表示字符串，%d 表示整数，%v 表示任意类型的值
	name := "Golang"
	version := 1.24
	fmt.Printf("欢迎学习 %s，版本 %.2f\n", name, version)

	// 输出结果：
	// Hello, Go 语言!
	// 欢迎学习 Golang，版本 1.24
}

// 编译运行方法：
// 方法1：go run 01_hello_world.go          ← 直接编译并运行，不生成二进制文件
// 方法2：go build 01_hello_world.go         ← 生成可执行文件 01_hello_world.exe（Windows）
//        ./01_hello_world                   ← 运行生成的可执行文件
