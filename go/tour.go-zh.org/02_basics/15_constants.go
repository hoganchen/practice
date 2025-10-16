package main

import "fmt"

/*
常量的类型
常量可以有类型，也可以无类型。无类型常量在使用时会根据上下文确定类型。

​有类型常量​：
const Pi float64 = 3.14159

​无类型常量​：
const Pi = 3.14159  // 无类型浮点常量
const value = 5     // 无类型整数常量

无类型常量在赋值给变量时，如果变量类型与常量值兼容，则会将常量转换为该类型。例如，可以将一个无类型整数常量赋值给int、float64等类型的变量。
*/
const Pi = 3.14
const typePi float64 = 3.14

/*

常量

常量的声明与变量类似，只不过是使用 const 关键字。

常量可以是字符、字符串、布尔值或数值。

常量不能用 := 语法声明。
*/

func main() {
	const World = "世界"
	fmt.Println("Hello", World)
	fmt.Println("Happy", Pi, "Day")
	fmt.Println("Pi:", Pi)
	fmt.Println("typePi:", typePi)

	const Truth = true
	fmt.Println("Go rules?", Truth)
}
