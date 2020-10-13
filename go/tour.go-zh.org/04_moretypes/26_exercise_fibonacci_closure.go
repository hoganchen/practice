package main

import "fmt"

// 返回一个“返回int的函数”
func fibonacci() func() int {
	t1 := 0
	t2 := 0
	tn := 0

	return func() int {
		tn = t1 + t2

		if tn == 0 {
			t2 = 1
		} else {
			t2 = t1
			t1 = tn
		}

		return tn
	}
}

/*

练习：斐波纳契闭包

让我们用函数做些好玩的事情。

实现一个 fibonacci 函数，它返回一个函数（闭包），该闭包返回一个斐波纳契数列 `(0, 1, 1, 2, 3, 5, ...)`。

*/
func main() {
	f := fibonacci()
	for i := 0; i < 30; i++ {
		// fmt.Println(f())
		fmt.Printf("%v, ", f())
	}
	fmt.Println()
}
