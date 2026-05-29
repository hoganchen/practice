// ============================================================
// 知识点：if/else 条件判断
//
// Go 的 if 语句特点：
// 1. 条件表达式不需要括号
// 2. 代码块必须有花括号
// 3. 支持在条件前添加简单语句（常用来声明局部变量）
// 4. 没有三元运算符（? :）
//
// 编译运行方法：
//   go run 01_if_else.go
// ============================================================

package main

import "fmt"

func main() {
	score := 85

	// -------- 基本 if-else --------
	if score >= 90 {
		fmt.Println("优秀")
	} else if score >= 80 {
		fmt.Println("良好")
	} else if score >= 60 {
		fmt.Println("及格")
	} else {
		fmt.Println("不及格")
	}

	// -------- if 中包含初始化语句 --------
	// 在 if 中声明的变量只在 if/else 块中有效
	if age := 20; age >= 18 {
		fmt.Println("已成年，年龄:", age)
	} else {
		fmt.Println("未成年，年龄:", age)
	}
	// fmt.Println(age) // 编译错误：age 已超出作用域

	// -------- 逻辑运算符组合 --------
	height := 175
	weight := 70

	if height > 170 && weight > 60 {
		fmt.Println("身高体重均达标")
	}

	if height > 180 || weight > 80 {
		fmt.Println("至少一项超标")
	}

	if !(height < 160) {
		fmt.Println("身高不低于160")
	}
}
