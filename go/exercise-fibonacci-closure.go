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

func main() {
	f := fibonacci()
	for i := 0; i < 30; i++ {
		// fmt.Println(f())
		fmt.Printf("%v, ", f())
	}

	fmt.Printf("\n")
}
