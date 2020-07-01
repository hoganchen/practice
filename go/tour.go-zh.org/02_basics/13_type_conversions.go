package main

import (
	"fmt"
	"math"
)

/*

类型转换

表达式 T(v) 将值 v 转换为类型 T。

一些关于数值的转换：

var i int = 42
var f float64 = float64(i)
var u uint = uint(f)

或者，更加简单的形式：

i := 42
f := float64(i)
u := uint(f)

与 C 不同的是，Go 在不同类型的项之间赋值时需要显式转换。试着移除例子中 float64 或 uint 的转换看看会发生什么。
*/

func main() {
	var x, y int = 3, 4
	var f float64 = math.Sqrt(float64(x*x + y*y))
	// 不同类型的项之间赋值时需要显式转换，不然导致错误如下
	// ./13_type_conversions.go:32:32: cannot use x * x + y * y (type int) as type float64 in argument to math.Sqrt
	// var g float64 = math.Sqrt(x*x + y*y)
	fmt.Println(f)
	var z uint = uint(f)
	fmt.Println(x, y, z)
}
