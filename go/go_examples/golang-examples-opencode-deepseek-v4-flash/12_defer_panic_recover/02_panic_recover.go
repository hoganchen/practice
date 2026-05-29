// ============================================================
// 知识点：panic 和 recover
//
// panic：引发运行时错误，中止当前函数执行，逐层向上返回。
// recover：捕获 panic，使程序恢复继续执行。
// recover 必须在 defer 中调用才有效。
//
// 适用场景：
//   panic — 不可恢复的严重错误（如数组越界）
//   recover — 在 goroutine 中防止崩溃
//
// 编译运行方法：
//   go run 02_panic_recover.go
// ============================================================

package main

import "fmt"

// -------- 包含 recover 的延迟函数 --------
func safeDivide(a, b int) (result int) {
	// defer + recover 捕获 panic
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("捕获到 panic:", r)
			result = 0 // 设置默认返回值
		}
	}()

	if b == 0 {
		panic("除数不能为零！")
	}
	return a / b
}

// -------- 多层调用下的 panic 恢复 --------
func level3() {
	panic("第3层出错了！")
}

func level2() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("level2 捕获:", r)
		}
	}()
	level3()
}

func level1() {
	level2()
	fmt.Println("level1 继续执行")
}

func main() {
	// -------- panic 被 recover 捕获 --------
	fmt.Println("=== recover 捕获 panic ===")
	result := safeDivide(10, 0)
	fmt.Println("结果:", result)

	// 后续代码正常执行
	fmt.Println("程序继续运行...")

	// -------- 多层 recover --------
	fmt.Println("\n=== 多层 recover ===")
	level1()
	fmt.Println("主函数继续...")
}
