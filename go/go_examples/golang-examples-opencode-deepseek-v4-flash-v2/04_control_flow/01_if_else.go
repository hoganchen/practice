// ============================================================================
// 知识点: if-else 条件判断
//
// 说明:
// - if 条件表达式不需要括号, 但代码块必须使用大括号 {}
// - if 语句支持在条件前执行一个简单语句(常用于声明局部变量)
// - else 和 else if 必须与前面的 } 在同一行
// - 条件表达式必须是布尔类型, 不能是隐式布尔转换 (如 if 1 {})
//
// 编译和运行:
//   go run 04_control_flow\01_if_else.go
// ============================================================================

package main

import (
	"fmt"
	"math/rand"
)

func main() {
	score := rand.Intn(100)

	// 标准 if-else
	if score >= 90 {
		fmt.Printf("成绩 %d: 优秀\n", score)
	} else if score >= 60 {
		fmt.Printf("成绩 %d: 及格\n", score)
	} else {
		fmt.Printf("成绩 %d: 不及格\n", score)
	}

	// if 中使用简短语句 (声明仅在 if 块内有效的变量)
	if age := 20; age >= 18 {
		fmt.Println("已成年, 年龄:", age)
	}

	// 检查map中是否存在key
	m := map[string]int{"a": 1, "b": 2}
	if value, exists := m["a"]; exists {
		fmt.Println("key 'a' 存在, 值:", value)
	}
}
