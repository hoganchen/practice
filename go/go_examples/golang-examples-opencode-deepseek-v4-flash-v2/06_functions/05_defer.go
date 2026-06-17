// ============================================================================
// 知识点: defer 延迟调用
//
// 说明:
// - defer 用于延迟执行一个函数调用, 在所在函数返回前执行
// - 多个 defer 按后进先出(LIFO)顺序执行
// - 常用于: 资源释放(关闭文件、解锁等)
// - defer 的参数在声明时求值, 而非执行时
// - defer 可以修改命名返回值
//
// 编译和运行:
//   go run 06_functions\05_defer.go
// ============================================================================

package main

import "fmt"

func deferOrder() {
	fmt.Println("开始")
	defer fmt.Println("defer 1")
	defer fmt.Println("defer 2")
	defer fmt.Println("defer 3")
	fmt.Println("结束")
}

func deferArgs() {
	x := 10
	defer fmt.Println("defer 时的 x 值:", x) // 参数在此时求值
	x = 100
	fmt.Println("修改后的 x 值:", x)
}

func deferReturn() (result int) {
	defer func() {
		result++ // 修改命名返回值
	}()
	result = 10
	fmt.Println("返回前的 result:", result)
	return result
}

func main() {
	fmt.Println("=== defer 执行顺序 ===")
	deferOrder()

	fmt.Println("\n=== defer 参数求值时机 ===")
	deferArgs()

	fmt.Println("\n=== defer 修改返回值 ===")
	r := deferReturn()
	fmt.Println("实际返回值:", r)
}
