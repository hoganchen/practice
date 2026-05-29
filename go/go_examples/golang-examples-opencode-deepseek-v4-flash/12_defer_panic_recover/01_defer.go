// ============================================================
// 知识点：defer 延迟执行
//
// defer 用于延迟执行一个函数调用，在所在函数返回前执行。
// 常用于资源释放（关闭文件、解锁等）。
// defer 按 LIFO（后进先出）顺序执行，类似栈。
// defer 的参数在声明时求值，而非执行时。
//
// 编译运行方法：
//   go run 01_defer.go
// ============================================================

package main

import "fmt"

func main() {
	// -------- defer 基本用法 --------
	fmt.Println("=== defer 基本用法 ===")
	defer fmt.Println("3. 这是最后执行的")
	defer fmt.Println("2. 这是第二后执行的")
	fmt.Println("1. 这是最先执行的")

	// -------- defer LIFO 顺序 --------
	fmt.Println("\n=== defer 栈（LIFO）===")
	for i := 0; i < 5; i++ {
		defer fmt.Printf("defer #%d\n", i)
	}
	fmt.Println("循环已结束")

	// -------- 实际应用：模拟资源释放 --------
	fmt.Println("\n=== 模拟资源管理 ===")
	simulateResourceOp()
}

// 模拟一个需要资源管理的函数
func simulateResourceOp() {
	fmt.Println("打开资源...")

	// defer 确保函数返回前一定执行资源释放
	defer fmt.Println("关闭资源完成")

	fmt.Println("使用资源中...")
	// 即使这里发生 panic，defer 也会执行
}
