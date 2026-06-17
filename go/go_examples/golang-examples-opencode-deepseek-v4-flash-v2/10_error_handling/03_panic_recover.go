// ============================================================================
// 知识点: panic 和 recover
//
// 说明:
// - panic 用于抛出异常, 会逐层向上传递直到程序崩溃
// - recover 用于捕获 panic, 必须在 defer 函数中调用才有效
// - 类似于其他语言的 try-catch, 但Go不推荐滥用
// - 建议仅在"不可能发生"的异常情况使用 panic
// - 一般错误使用 error 返回值处理
//
// 编译和运行:
//   go run 10_error_handling\03_panic_recover.go
// ============================================================================

package main

import "fmt"

func safeCall(fn func()) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("捕获到 panic: %v", r)
		}
	}()
	fn()
	return
}

func mayPanic(shouldPanic bool) {
	fmt.Println("  mayPanic 开始")
	if shouldPanic {
		panic("出错了!")
	}
	fmt.Println("  mayPanic 正常结束")
}

func main() {
	// 正常调用
	fmt.Println("正常调用:")
	if err := safeCall(func() { mayPanic(false) }); err != nil {
		fmt.Println("错误:", err)
	} else {
		fmt.Println("调用成功")
	}

	// 会 panic 的调用
	fmt.Println("\n会 panic 的调用:")
	if err := safeCall(func() { mayPanic(true) }); err != nil {
		fmt.Println("捕获到错误:", err)
	}
	fmt.Println("程序继续执行...")
}
