/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

var SLICE_LEN = 5
var SLICE_CAP = 10

func slice_append(slice []int) {
	fmt.Printf("In slice_append function, slice address: %p, slice value: %v\n", &slice, slice)

	for i := 0; i < SLICE_LEN - 1; i++ {
		slice = append(slice, i)
		for j := 0; j < len(slice); j++ {
			fmt.Printf("&slice[%v]: %p, slice[%v]: %v\n", j, &slice[j], j, slice[j])
		}
	}

	fmt.Printf("In slice_append function, slice address: %p, slice value: %v\n", &slice, slice)
}

func slice_op(slice []int) {
	fmt.Printf("In slice_op function, slice address: %p, slice value: %v\n", &slice, slice)

	// slice = append(slice, 1)
	for i := 0; i < SLICE_LEN; i++ {
		fmt.Printf("&slice[%v]: %p, slice[%v]: %v\n", i, &slice[i], i, slice[i])
		slice[i]= i
	}

	fmt.Printf("In slice_op function, slice address: %p, slice value: %v\n", &slice, slice)
}

/*
slice当作参数传递的时候，形参是实参slice的拷贝，array地址，len，cap均相等；
函数内对slice进行修改，没有因为容量不足而触发array重新分配，会影响到实参。
https://solupro.org/Go-slice-parameter-for-function/
*/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	slice := make([]int, SLICE_LEN, SLICE_CAP)

	fmt.Printf("In main function, slice address: %p, slice value: %v\n", &slice, slice)
	for i := 0; i < SLICE_LEN; i++ {
		fmt.Printf("&slice[%v]: %p, slice[%v]: %v\n", i, &slice[i], i, slice[i])
	}

	// slice_op(slice)

	slice_append(slice)
	// 扩展切片；你可以通过重新切片来扩展一个切片，给它提供足够的容量。试着修改示例程序中的切片操作，向外扩展它的容量，看看会发生什么。
	extend_slice := slice[:SLICE_CAP]
	extend_slice[SLICE_CAP -1] = 10

	fmt.Printf("In main function, slice address: %p, slice value: %v\n", &slice, slice)
	fmt.Printf("In main function, extend_slice address: %p, extend_slice value: %v\n", &extend_slice, extend_slice)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
