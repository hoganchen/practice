// ============================================================
// 知识点：defer 延迟调用
//
// defer 用于注册延迟执行的函数调用，在包裹函数返回前执行。
// 常用于资源清理（关闭文件、解锁互斥锁、释放连接）。
// 多个 defer 按照 LIFO（后进先出）顺序执行。
// defer 的参数在注册时求值，而不是执行时。
// ============================================================

package main

import (
	"fmt"
	"os"
)

func main() {
	// ---- 1. defer 基本用法 ----
	fmt.Println("--- defer 基本用法 ---")
	// defer 在 main 函数返回前执行
	defer fmt.Println("  [defer 1] main 结束前的清理")
	defer fmt.Println("  [defer 2] 清理工作...")

	fmt.Println("  main 函数执行中...")
	fmt.Println("  main 即将结束...")
	// 输出顺序：
	//   main 函数执行中...
	//   main 即将结束...
	//   [defer 2] 清理工作...    ← LIFO
	//   [defer 1] main 结束前的清理

	// ---- 2. defer 执行顺序：LIFO ----
	fmt.Println("\n--- defer 栈（LIFO）---")
	for i := 1; i <= 5; i++ {
		defer fmt.Printf("  defer #%d\n", i)
	}
	// 输出: 5, 4, 3, 2, 1

	// ---- 3. defer 参数即时求值 ----
	fmt.Println("\n--- defer 参数求值时机 ---")
	x := 10
	defer fmt.Println("  defer 中的 x =", x) // 输出 10（注册时求值）
	x = 20
	fmt.Println("  修改后的 x =", x) // 输出 20

	// ---- 4. defer 与闭包配合获取最终值 ----
	y := 100
	defer func() {
		fmt.Println("  闭包 defer 中的 y =", y) // 输出 200（执行时取值）
	}()
	y = 200
	fmt.Println("  修改后的 y =", y)

	// ---- 5. defer 用于资源管理 ----
	fmt.Println("\n--- defer 资源管理 ---")
	// 模拟文件操作
	filename := "example.txt"

	// 创建临时文件
	f, err := os.CreateTemp("", "example_*.txt")
	if err != nil {
		fmt.Println("创建失败:", err)
		return
	}
	// defer 确保文件关闭（即使后面出错）
	defer f.Close()
	defer fmt.Println("  文件已关闭")

	// 写入内容
	fmt.Fprintf(f, "Hello, defer!\n")
	defer fmt.Println("  文件写入完成")

	// 注意：defer 注册顺序和执行顺序相反
	// 注册: f.Close → "文件已关闭" → "文件写入完成"
	// 执行: "文件写入完成" → "文件已关闭" → f.Close()

	// ---- 6. defer 与 return 的交互 ----
	fmt.Println("\n--- defer 改变返回值 ---")
	result := deferAndReturn()
	fmt.Println("  最终返回值:", result) // 输出 2（不是 1）

	// ---- 7. defer 的常见用途 ----
	fmt.Println("\n--- defer 常见用途 ---")

	// 测量函数执行时间
	deferFunc := timeTrack("doSomething")
	// 模拟做一些工作
	doWork := 0
	for i := 0; i < 10000000; i++ {
		doWork += i
	}
	_ = doWork
	deferFunc() // 在函数结束时打印耗时

	// 清理工作
	os.Remove(filename) // 删除临时文件
}

// ---- 演示 defer 与命名返回值的交互 ----
func deferAndReturn() (result int) {
	result = 1
	defer func() {
		result = 2 // 修改命名返回值
	}()
	return result // 实际返回 2（defer 修改了 result）
}

// ---- 计时器惯用法 ----
func timeTrack(name string) func() {
	start := os.Getenv("_") // 简化版，实际使用 time.Now()
	_ = start
	fmt.Printf("  [计时] %s 开始执行...\n", name)
	return func() {
		fmt.Printf("  [计时] %s 执行完毕\n", name)
	}
}

// 编译运行：go run 05_defer.go
