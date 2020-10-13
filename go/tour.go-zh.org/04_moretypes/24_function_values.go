package main

import (
	"fmt"
	"math"
)

// fn为参数名，参数的类型为函数类型，即(func(float64, float64) float64)为参数fn的类型
func compute(fn func(float64, float64) float64) float64 {
	return fn(3, 4)
}

func computed(fn func(float64, float64) float64, x float64, y float64) float64 {
	return fn(x, y)
}

/*

函数值

函数也是值。它们可以像其它值一样传递。

函数值可以用作函数的参数或返回值。

*/
func main() {
	hypot := func(x, y float64) float64 {
		return math.Sqrt(x*x + y*y)
	}

	// cannot use x * x + y * y (type int) as type float64 in argument to math.Sqrt
	// 即math.Sqrt的参数类型为float64类型
	// hypoted := func(x, y int) float64 {
	// 	return math.Sqrt(x*x + y*y)
	// }

	fmt.Println(hypot(5, 12))

	fmt.Println(compute(hypot))
	fmt.Println(compute(math.Pow))

	fmt.Println(computed(hypot, 5, 12))
	fmt.Println(computed(math.Pow, 5, 4))
}
