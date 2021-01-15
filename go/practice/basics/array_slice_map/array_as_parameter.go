/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func array_operation(arr [10]int) {
	fmt.Printf("arr address: %p, arr: %v, len(arr): %v, cap(arr): %v\n", &arr, arr, len(arr), cap(arr))

	for i := 0; i < 10; i++ {
		arr[i] = i
	}
}

func array_operation_ptr(arr *[10]int) {
	fmt.Printf("arr address: %p, arr: %v, len(arr): %v, cap(arr): %v\n", arr, *arr, len(*arr), cap(*arr))

	for i := 0; i < 10; i++ {
		arr[i] = i
		// (*arr)[i] = i
	}
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var arr = [10]int{}
	fmt.Printf("arr address: %p, arr: %v, len(arr): %v, cap(arr): %v\n", &arr, arr, len(arr), cap(arr))

	array_operation(arr)
	for i := 0; i < 10; i++ {
		fmt.Printf("arr[%v] = %v\n", i, arr[i])
	}

	array_operation_ptr(&arr)
	for i := 0; i < 10; i++ {
		fmt.Printf("arr[%v] = %v\n", i, arr[i])
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
