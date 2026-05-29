// ============================================================
// 知识点：switch 语句
//
// Go 的 switch 比 C 更灵活：case 自动 break，不需要手动写 break。
// 支持多个匹配值、表达式条件、无表达式类型、类型断言 switch。
// fallthrough 关键字可以继续执行下一个 case。
// ============================================================

package main

import (
	"fmt"
	"time"
)

func main() {
	// ---- 1. 基本 switch（值匹配） ----
	day := time.Now().Weekday()
	switch day {
	case time.Saturday, time.Sunday: // 多值匹配
		fmt.Println("今天是周末！")
	default:
		fmt.Println("今天是工作日")
	}

	// ---- 2. switch 作为 if-else 链（无表达式） ----
	// switch 后不带表达式，case 使用布尔表达式
	hour := time.Now().Hour()
	switch {
	case hour < 6:
		fmt.Println("凌晨好！")
	case hour < 12:
		fmt.Println("上午好！")
	case hour < 18:
		fmt.Println("下午好！")
	default:
		fmt.Println("晚上好！")
	}

	// ---- 3. fallthrough 用法 ----
	// fallthrough 强制执行下一个 case 块
	score := 85
	switch {
	case score >= 90:
		fmt.Print("优秀 ")
		// fallthrough  // 放开注释会强制执行下一行
	case score >= 80:
		fmt.Print("良好 ") // 输出：良好
		fallthrough // 强制执行下一行（即使条件不匹配）
	case score >= 70:
		fmt.Println("中等")
		// 输出：良好 中等
	case score >= 60:
		fmt.Println("及格")
	default:
		fmt.Println("不及格")
	}

	// ---- 4. 类型 switch（type switch） ----
	// 用于判断接口值的动态类型
	checkType := func(v interface{}) {
		switch t := v.(type) {
		case int:
			fmt.Printf("整型: %d\n", t)
		case string:
			fmt.Printf("字符串: %s\n", t)
		case bool:
			fmt.Printf("布尔: %t\n", t)
		case float64, float32:
			fmt.Printf("浮点: %.2f\n", t)
		case nil:
			fmt.Println("nil 值")
		default:
			fmt.Printf("未知类型: %T\n", t)
		}
	}

	checkType(42)       // 整型: 42
	checkType("hello")  // 字符串: hello
	checkType(3.14)     // 浮点: 3.14
	checkType(nil)      // nil 值
	checkType([]int{1}) // 未知类型: []int

	// ---- 5. 在 switch 中使用初始化语句 ----
	switch v := 100; {
	case v < 50:
		fmt.Printf("%d < 50\n", v)
	case v < 200:
		fmt.Printf("50 <= %d < 200\n", v) // ← 输出
	}
}

// 编译运行：go run 02_switch.go
