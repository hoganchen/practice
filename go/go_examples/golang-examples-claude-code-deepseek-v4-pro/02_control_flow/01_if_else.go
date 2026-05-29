// ============================================================
// 知识点：if-else 条件判断
//
// Go 的 if 语句不需要括号包裹条件！但大括号 { } 是必须的。
// 支持在 if 条件前执行一个短语句（常用于变量声明）。
// ============================================================

package main

import (
	"fmt"
	"math"
)

func main() {
	// ---- 1. 基本 if-else ----
	score := 85

	if score >= 90 {
		fmt.Println("等级：A")
	} else if score >= 80 {
		fmt.Println("等级：B") // ← 输出
	} else if score >= 70 {
		fmt.Println("等级：C")
	} else {
		fmt.Println("等级：D")
	}

	// ---- 2. 带短语句的 if ----
	// 在 if 条件前可以执行一个语句，其在 if 块内可见
	if v := math.Sqrt(144); v >= 10 {
		fmt.Printf("√144 = %.1f >= 10\n", v)
	}
	// 注意：v 的作用域仅限于 if/else 块
	// fmt.Println(v)  // 编译错误：v 未定义

	// ---- 3. 不加括号的写法 ----
	age := 18
	if age >= 18 {
		fmt.Println("成年人")
	} else {
		fmt.Println("未成年人")
	}

	// ---- 4. 判断 map/通道 操作是否成功（comma-ok 惯用法） ----
	m := map[string]int{"a": 1, "b": 2}
	if value, ok := m["a"]; ok {
		fmt.Printf("键 'a' 存在，值为 %d\n", value)
	}
	if value, ok := m["c"]; !ok {
		fmt.Printf("键 'c' 不存在，value 为零值 %d\n", value)
	}

	// ---- 5. Go 1.22+ 中 if 语句的增强 ----
	// 可以在 if 的初始化语句中使用 range 等
	numbers := []int{10, 20, 30, 40, 50}
	for i, v := range numbers {
		// 注意：Go 1.22 开始，循环变量每次迭代都是新的变量
		// 不再有经典的"取闭包地址"问题
		if v > 30 {
			fmt.Printf("numbers[%d] = %d > 30\n", i, v)
		}
	}
}

// 编译运行：go run 01_if_else.go
