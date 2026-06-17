// ============================================================================
// 知识点: switch 分支语句
//
// 说明:
// - Go的switch自动break, 不需要显式写break
// - 每个case执行完后自动跳出, 不会fall through到下一个case
// - 使用 fallthrough 关键字可以强制穿透到下一个case
// - switch 后面可以不接表达式, 相当于 if-else 链
// - case 支持多个匹配值, 用逗号分隔
//
// 编译和运行:
//   go run 04_control_flow\03_switch.go
// ============================================================================

package main

import (
	"fmt"
	"time"
)

func main() {
	// 标准 switch
	day := time.Now().Weekday()
	switch day {
	case time.Saturday, time.Sunday: // 多值匹配
		fmt.Println("今天是周末!")
	default:
		fmt.Printf("今天是%s, 工作日\n", day)
	}

	// 无表达式的 switch (相当于 if-else)
	hour := time.Now().Hour()
	switch {
	case hour < 12:
		fmt.Println("上午好")
	case hour < 18:
		fmt.Println("下午好")
	default:
		fmt.Println("晚上好")
	}

	// switch 配合简短语句
	switch n := 7; n % 2 {
	case 0:
		fmt.Println(n, "是偶数")
	case 1:
		fmt.Println(n, "是奇数")
	}
}
