// ============================================================
// 知识点：switch 分支选择
//
// Go 的 switch 特性：
// 1. 每个 case 默认带 break（不会向下穿透）
// 2. 需要穿透时使用 fallthrough 关键字
// 3. case 可以包含多个值（逗号分隔）
// 4. switch 后可以不跟表达式（相当于 if-else 链）
// 5. 支持在 switch 中初始化变量
//
// 编译运行方法：
//   go run 03_switch.go
// ============================================================

package main

import (
	"fmt"
	"time"
)

func main() {
	// -------- 基本 switch：匹配值 --------
	day := time.Now().Weekday()
	switch day {
	case time.Saturday, time.Sunday: // 多个值用逗号分隔
		fmt.Println("今天是周末！")
	case time.Friday:
		fmt.Println("明天就是周末了！")
	default:
		fmt.Println("今天是工作日。")
	}

	// -------- switch 不带表达式（替代 if-else 链）--------
	score := 88
	switch {
	case score >= 90:
		fmt.Println("等级：A")
	case score >= 80:
		fmt.Println("等级：B")
	case score >= 70:
		fmt.Println("等级：C")
	case score >= 60:
		fmt.Println("等级：D")
	default:
		fmt.Println("等级：F")
	}

	// -------- switch 初始化语句 --------
	switch os := "linux"; os {
	case "windows":
		fmt.Println("Windows 系统")
	case "linux":
		fmt.Println("Linux 系统")
	case "darwin":
		fmt.Println("macOS 系统")
	default:
		fmt.Println("未知系统")
	}
	// fmt.Println(os) // 编译错误：os 超出作用域

	// -------- fallthrough 穿透 --------
	// 使用 fallthrough 会强制执行下一个 case
	switch num := -5; {
	case num < 0:
		fmt.Println("负数")
		fallthrough // 强制执行下一分支
	case num < 10:
		fmt.Println("小于10")
		// 没有 fallthrough，到这里停止
	case num < 100:
		fmt.Println("小于100")
	}
}
