// ============================================================
// 知识点：panic 和 recover
//
// panic 会导致程序恐慌（类似异常），终止当前函数并逐层返回。
// defer 中的 recover 可以捕获 panic，使程序继续运行。
// 适用场景：不可恢复的错误（如无法绑定的端口）。
// 不要在常规错误处理中使用 panic/recover，请用 error。
// ============================================================

package main

import (
	"fmt"
)

// ---- 1. panic 基本用法 ----

func main() {
	// ---- 1. panic 导致堆栈展开 ----
	// 取消注释查看效果：
	// fmt.Println("准备 panic...")
	// panic("发生严重错误！")
	// fmt.Println("这行不会执行")

	// ---- 2. recover 捕获 panic ----
	fmt.Println("--- recover 捕获 panic ---")

	safeDivide := func(a, b int) (result int) {
		// defer 中的 recover 可以捕获 panic
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("捕获到 panic: %v\n", r)
				result = 0 // 设置返回值为零值
			}
		}()

		if b == 0 {
			panic(fmt.Sprintf("除以零！a=%d, b=%d", a, b))
		}
		return a / b
	}

	fmt.Println("safeDivide(10, 2) =", safeDivide(10, 2)) // 5
	fmt.Println("safeDivide(10, 0) =", safeDivide(10, 0)) // 0（被 recover 了）
	fmt.Println("程序继续运行...")                            // 正常执行

	// ---- 3. recover 只在 defer 中有效 ----
	fmt.Println("\n--- recover 只在 defer 中有效 ---")
	// 直接调用 recover 返回 nil，没有用
	r := recover()
	fmt.Println("直接 recover:", r) // nil

	// ---- 4. 多层函数调用中的 panic/recover ----
	fmt.Println("\n--- 多层调用 ---")
	level3 := func() {
		panic("level3 出错了！")
	}
	level2 := func() {
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("level2 捕获: %v\n", r)
			}
		}()
		level3() // panic 从 level3 向上传播
		fmt.Println("level2 剩余代码") // 不会执行（因为 level3 的 panic）
	}
	level1 := func() {
		level2()
		fmt.Println("level1 剩余代码") // 正常执行（level2 已 recover）
	}

	level1()
	fmt.Println("程序继续...")

	// ---- 5. recover 后重新 panic ----
	fmt.Println("\n--- 重新 panic ---")
	recoverAndRePanic := func() {
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("捕获到: %v，但决定重新抛出\n", r)
				panic(r) // 重新 panic
			}
		}()
		panic("严重错误")
	}

	// 外面再包一层 recover
	func() {
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("外层捕获重新抛出的 panic: %v\n", r)
			}
		}()
		recoverAndRePanic()
	}()

	// ---- 6. 常见 panic 场景 ----
	fmt.Println("\n--- 常见 panic 场景 ---")
	safeAccess := func() {
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("安全处理 panic: %v\n", r)
			}
		}()

		// 越界访问
		s := []int{1, 2, 3}
		_ = s[10] // panic: index out of range
	}

	safeAccess()

	safeNilCall := func() {
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("安全处理 nil 指针: %v\n", r)
			}
		}()

		var p *int
		*p = 42 // panic: nil 指针解引用
	}

	safeNilCall()

	// ---- 7. 数组越界的 recover ----
	fmt.Println("\n--- 数组越界 ---")
	handlePanic := func(f func()) (ok bool) {
		ok = true
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("函数 panic 了: %v\n", r)
				ok = false
			}
		}()
		f()
		return
	}

	result := handlePanic(func() {
		nums := [3]int{1, 2, 3}
		fmt.Println(nums[5]) // panic
	})
	fmt.Printf("函数执行成功: %t\n", result)

	// ---- 8. 实际建议 ----
	fmt.Println("\n--- 使用建议 ---")
	fmt.Println("✅ 用 error 返回值处理预期错误")
	fmt.Println("✅ 用 panic 处理不可恢复的错误（如无法 bind 端口）")
	fmt.Println("✅ 用 recover 防止程序崩溃（如 HTTP handler 中）")
	fmt.Println("❌ 不要使用 panic/recover 替代 error 处理")
	fmt.Println("❌ 不要在非 defer 函数中使用 recover")
}

// 编译运行：go run 03_panic_recover.go
