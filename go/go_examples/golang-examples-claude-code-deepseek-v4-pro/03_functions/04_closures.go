// ============================================================
// 知识点：闭包（Closure）
//
// 闭包是捕获了外部环境变量的函数值。
// Go 的函数是一等公民：可以赋值给变量，作为参数传递，作为返回值。
// 闭包在 Go 中广泛应用于回调、装饰器、生成器等场景。
// Go 1.22+ 修复了经典循环变量闭包问题。
// ============================================================

package main

import "fmt"

// ---- 1. 闭包：函数返回值 ----
// 返回一个"累加器"函数，每次调用加 1
func newCounter() func() int {
	count := 0                   // 捕获这个变量
	return func() int {
		count++                   // 闭包引用了外层函数的 count
		return count
	}
}

// ---- 2. 闭包：生成特定逻辑的函数 ----
func makeMultiplier(factor int) func(int) int {
	return func(x int) int {
		return x * factor
	}
}

// ---- 3. 闭包的典型应用：斐波那契生成器 ----
func fibonacci() func() int {
	a, b := 0, 1
	return func() int {
		result := a
		a, b = b, a+b
		return result
	}
}

func main() {
	// ---- 1. 闭包示例 ----
	counter1 := newCounter()
	counter2 := newCounter() // 独立闭包，各自的 count

	fmt.Println("--- 计数器 ---")
	fmt.Println("counter1:", counter1()) // 1
	fmt.Println("counter1:", counter1()) // 2
	fmt.Println("counter2:", counter2()) // 1（新闭包）
	fmt.Println("counter1:", counter1()) // 3
	fmt.Println("counter2:", counter2()) // 2

	// ---- 2. 生成乘法器 ----
	fmt.Println("\n--- 乘法器 ---")
	double := makeMultiplier(2)
	triple := makeMultiplier(3)

	fmt.Println("double(5) =", double(5))   // 10
	fmt.Println("triple(5) =", triple(5))   // 15
	fmt.Println("double(10) =", double(10)) // 20

	// ---- 3. 斐波那契生成器 ----
	fmt.Println("\n--- 斐波那契数列 ---")
	fib := fibonacci()
	for i := 0; i < 10; i++ {
		fmt.Printf("  fib(%d) = %d\n", i, fib())
	}

	// ---- 4. 函数作为参数：map 函数 ----
	fmt.Println("\n--- map 函数 ---")
	nums := []int{1, 2, 3, 4, 5}

	// 定义高阶函数 mapInt
	mapInt := func(arr []int, fn func(int) int) []int {
		result := make([]int, len(arr))
		for i, v := range arr {
			result[i] = fn(v)
		}
		return result
	}

	// 传入匿名函数
	doubled := mapInt(nums, func(x int) int { return x * 2 })
	fmt.Println("翻倍:", doubled) // [2, 4, 6, 8, 10]

	squared := mapInt(nums, func(x int) int { return x * x })
	fmt.Println("平方:", squared) // [1, 4, 9, 16, 25]

	// ---- 5. 闭包陷阱修复（Go 1.22+） ----
	// 在 Go 1.22 之前，下面的代码会输出 "5 5 5 5 5"
	// Go 1.22 开始，每次迭代创建新的循环变量，修复了这个问题
	fmt.Println("\n--- 闭包陷阱修复（Go 1.22+）---")
	var funcs []func()
	for i := 0; i < 5; i++ {
		funcs = append(funcs, func() {
			fmt.Printf("  %d ", i)
		})
	}
	for _, f := range funcs {
		f()
	}
	fmt.Println() // 输出: 0 1 2 3 4（Go 1.22+）
}

// 编译运行：go run 04_closures.go
