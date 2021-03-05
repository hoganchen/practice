/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func slice_copy() {
	slice1 := make([]int, 5, 5)
	slice2 := slice1
	slice1[1] = 1
	fmt.Println(slice1) //[0 1 0 0 0]
	fmt.Println(slice2) //[0 1 0 0 0]
}

func slice_deep_copy() {
	slice1 := make([]int, 5, 5)
	slice1[0] = 9
	slice2 := make([]int, 4, 4)
	slice3 := make([]int, 5, 5)
	//拷贝
	fmt.Println(copy(slice2, slice1)) //4
	fmt.Println(copy(slice3, slice1)) //5
	//独立修改
	slice2[1] = 2
	slice3[1] = 3
	fmt.Println(slice1) //[9 0 0 0 0]
	fmt.Println(slice2) //[9 2 0 0]
	fmt.Println(slice3) //[9 3 0 0 0]
}

// 浅拷贝和深拷贝
// https://davidchan0519.github.io/2019/04/22/go-slice-copy/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	slice_copy()
	slice_deep_copy()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
