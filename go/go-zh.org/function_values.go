package main

import (
	"fmt"
	"math"
)

/*
函数也是值。它们可以像其它值一样传递。
函数值可以用作函数的参数或返回值。
*/
func compute(fn func(float64, float64) float64) float64 {
	return fn(3, 4)
}

func compute_param(fn func(float64, float64) float64, x, y float64) float64 {
	return fn(x, y)
}

func main() {
	hypot := func(x, y float64) float64 {
		return math.Sqrt(x*x + y*y)
	}
	fmt.Println(hypot(5, 12))

	fmt.Println(compute(hypot))
	fmt.Println(compute(math.Pow))

	fmt.Println(compute_param(hypot, 3, 4))
	fmt.Println(compute_param(math.Pow, 5, 6))
}
