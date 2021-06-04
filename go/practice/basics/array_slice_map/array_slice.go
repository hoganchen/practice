/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

// https://chai2010.gitbooks.io/advanced-go-programming-book/content/ch1-basic/ch1-03-array-string-and-slice.html
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	int_array_01 := [5]int{1, 2, 3, 4, 5}
	int_array_02 := [...]int{1, 2, 3, 4, 5}
	int_slice_01 := []int{1, 2, 3, 4, 5}
	int_slice_02 := int_array_01[:]

	fmt.Printf("type of int_array_01: %T, address of int_array_01: %p, address of int_array_01[0]: %p, length of int_array_01: %v\n", int_array_01, &int_array_01, &int_array_01[0], len(int_array_01))
	fmt.Printf("type of int_array_02: %T, address of int_array_02: %p, address of int_array_02[0]: %p, length of int_array_02: %v\n", int_array_02, &int_array_02, &int_array_02[0], len(int_array_02))
	fmt.Printf("type of int_slice_01: %T, address of int_slice_01: %p, address of int_slice_01[0]: %p, length of int_slice_01: %v\n", int_slice_01, &int_slice_01, &int_slice_01[0], len(int_slice_01))
	fmt.Printf("type of int_slice_02: %T, address of int_slice_02: %p, address of int_slice_02[0]: %p, length of int_slice_02: %v\n\n", int_slice_02, &int_slice_02, &int_slice_02[0], len(int_slice_02))

	// first argument to append must be slice; have [5]int
	// 从如下错误可以看出，只有在定义时指定了长度，或者用...表示的，才是数组，定义为[]T都是slice
	// 而且从内存分布上也可以看出，数组第一个元素的地址就是数组地址，而slice则不是
	// type of int_array_01: [5]int; type of int_array_02: [5]int
	/*
		for i := 0; i < 10; i++ {
			int_array = append(int_array, i)
		}

		fmt.Printf("type of int_array_01: %T, address of int_array_01: %p, address of int_array_01[0]: %p, length of int_array_01: %v\n", int_array_01, &int_array_01, &int_array_01[0], len(int_array_01))
		fmt.Printf("type of int_array_02: %T, address of int_array_02: %p, address of int_array_02[0]: %p, length of int_array_02: %v\n", int_array_02, &int_array_02, &int_array_02[0], len(int_array_02))
		fmt.Printf("type of int_slice_01: %T, address of int_slice_01: %p, address of int_slice_01[0]: %p, length of int_slice_01: %v\n", int_slice_01, &int_slice_01, &int_slice_01[0], len(int_slice_01))
		fmt.Printf("type of int_slice_02: %T, address of int_slice_02: %p, address of int_slice_02[0]: %p, length of int_slice_02: %v\n\n", int_slice_02, &int_slice_02, &int_slice_02[0], len(int_slice_02))
	*/

	for i := 0; i < 10; i++ {
		int_slice_01 = append(int_slice_01, i)
	}

	fmt.Printf("type of int_array_01: %T, address of int_array_01: %p, address of int_array_01[0]: %p, length of int_array_01: %v\n", int_array_01, &int_array_01, &int_array_01[0], len(int_array_01))
	fmt.Printf("type of int_array_02: %T, address of int_array_02: %p, address of int_array_02[0]: %p, length of int_array_02: %v\n", int_array_02, &int_array_02, &int_array_02[0], len(int_array_02))
	fmt.Printf("type of int_slice_01: %T, address of int_slice_01: %p, address of int_slice_01[0]: %p, length of int_slice_01: %v\n", int_slice_01, &int_slice_01, &int_slice_01[0], len(int_slice_01))
	fmt.Printf("type of int_slice_02: %T, address of int_slice_02: %p, address of int_slice_02[0]: %p, length of int_slice_02: %v\n\n", int_slice_02, &int_slice_02, &int_slice_02[0], len(int_slice_02))

	for i := 0; i < 10; i++ {
		int_slice_02 = append(int_slice_02, i)
	}

	fmt.Printf("type of int_array_01: %T, address of int_array_01: %p, address of int_array_01[0]: %p, length of int_array_01: %v\n", int_array_01, &int_array_01, &int_array_01[0], len(int_array_01))
	fmt.Printf("type of int_array_02: %T, address of int_array_02: %p, address of int_array_02[0]: %p, length of int_array_02: %v\n", int_array_02, &int_array_02, &int_array_02[0], len(int_array_02))
	fmt.Printf("type of int_slice_01: %T, address of int_slice_01: %p, address of int_slice_01[0]: %p, length of int_slice_01: %v\n", int_slice_01, &int_slice_01, &int_slice_01[0], len(int_slice_01))
	fmt.Printf("type of int_slice_02: %T, address of int_slice_02: %p, address of int_slice_02[0]: %p, length of int_slice_02: %v\n\n", int_slice_02, &int_slice_02, &int_slice_02[0], len(int_slice_02))

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
