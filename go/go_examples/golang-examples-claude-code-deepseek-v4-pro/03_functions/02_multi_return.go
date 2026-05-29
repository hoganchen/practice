// ============================================================
// 知识点：多返回值与裸返回
//
// Go 函数原生支持多返回值，这是 Go 的核心设计之一。
// 常用于返回结果 + 错误信息的惯用模式。
// 命名返回值支持裸返回（naked return），但谨慎使用。
// ============================================================

package main

import (
	"errors"
	"fmt"
)

// ---- 1. 多返回值的基本用法 ----
// 标准模式：(result, error)
func safeDivide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, errors.New("不能除以零")
	}
	return a / b, nil
}

// ---- 2. 命名返回值 + 裸返回 ----
// 返回值被预先命名，相当于在函数开始时声明了变量
// 裸返回在某些场景可以使代码更清晰
func splitBudget(budget float64, people int) (perPerson float64, remainder float64, err error) {
	if people <= 0 {
		// 命名返回值可以直接 return，但这里用 error 返回
		err = errors.New("人数必须大于 0")
		return // 裸返回：返回 perPerson, remainder, err
	}
	if budget <= 0 {
		err = errors.New("预算必须大于 0")
		return
	}

	perPerson = budget / float64(people)
	remainder = budget - perPerson*float64(people)
	// 注意：remainder 通常使用取模更精确，这里用浮点只是为了演示
	return // 裸返回
}

// ---- 3. 将多返回值用作函数参数 ----
// Go 不允许直接将一个多返回值展开为另一个函数的参数（某些情况除外）
func logResult(name string, value float64, err error) {
	if err != nil {
		fmt.Printf("[%s] 错误: %v\n", name, err)
	} else {
		fmt.Printf("[%s] 结果: %.2f\n", name, value)
	}
}

func main() {
	// ---- 1. 基本多返回值 ----
	result, err := safeDivide(10, 3)
	if err != nil {
		fmt.Println("错误:", err)
	} else {
		fmt.Printf("10/3 = %.4f\n", result)
	}

	// ---- 2. 使用 _ 忽略某个返回值 ----
	area, _ := rectangleInfo(5, 3) // 忽略周长
	fmt.Printf("面积 = %.0f\n", area)

	// ---- 3. 命名返回值 + 裸返回 ----
	perPerson, remainder, err := splitBudget(1000, 3)
	if err != nil {
		fmt.Println("错误:", err)
	} else {
		fmt.Printf("每人: %.2f, 剩余: %.2f\n", perPerson, remainder)
	}

	// ---- 4. 错误的预算分配 ----
	_, _, err = splitBudget(-100, 2)
	fmt.Println("负预算:", err)

	_, _, err = splitBudget(100, 0)
	fmt.Println("零人数:", err)

	// ---- 5. 多返回值与 logResult ----
	// 注意：Go 不支持直接展开返回值为参数，需要手动传
	r, e := safeDivide(15, 4)
	logResult("除法", r, e)

	logResult("预期错误", 0, errors.New("发生了意外"))

	fmt.Println("--- 演示完毕 ---")
}

// 辅助函数（用于 _ 忽略演示）
func rectangleInfo(w, h float64) (float64, float64) {
	return w * h, 2 * (w + h)
}

// 编译运行：go run 02_multi_return.go
