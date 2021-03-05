/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func fibonacci(n int)(res int) {
	if n <= 1 {
		res = 1
	} else {
		res = fibonacci(n - 1) + fibonacci(n - 2)
	}

	return
}

func fibonacci_new(n int)(res int) {
	t1 := 1
	t2 := 0
	tn := 0

	if n <= 1 {
		tn = t1 + t2
	} else {
		for i := 0; i < n; i++ {
			tn = t1 + t2

			t2 = t1
			t1 = tn
		}
	}

	return tn
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	fmt.Printf("fibonacci(10) = %v\n", fibonacci(10))
	// fmt.Printf("fibonacci(2^64) = %v\n", fibonacci(2^64))

	fmt.Printf("fibonacci_new(10) = %v\n", fibonacci_new(2))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
