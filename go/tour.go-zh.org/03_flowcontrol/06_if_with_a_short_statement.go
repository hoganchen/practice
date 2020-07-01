package main

import (
	"fmt"
	"math"
)

/*

if 的简短语句

同 for 一样， if 语句可以在条件表达式前执行一个简单的语句。

该语句声明的变量作用域仅在 if 之内。

（在最后的 return 语句处使用 v 看看。）
*/

func pow(x, n, lim float64) float64 {
	// v的作用域仅限于if语句块
	if v := math.Pow(x, n); v < lim {
		return v
	}
	// fmt.Println("v = %v", v)
	// fmt.Printf("v = %v\n", v)
	return lim
}

func pow_(x, n, lim float64) float64 {
	// v的作用域仅限于if语句块
	if v := math.Pow(x, n); v < lim {
		return v
	} else {
		// Println不能用于格式化输出，Printf则可以
		fmt.Println("v = %v", v)
		fmt.Println("v =", v)
		fmt.Printf("v = %v\n", v)
		return lim
	}
}

func main() {
	fmt.Println(
		pow(3, 2, 10),
		pow(3, 3, 20),
		pow_(3, 2, 10),
		pow_(3, 3, 20),
	)
}
