/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

// 可变参数是函数最右边的参数，普通参数放在左侧
// 需要注意的是，可变参数是函数最右边的参数，普通参数放在左侧，可以0到n个。
func variableParam(name string, args ...int) {
	fmt.Printf("name: %v\n", name)
	for _, value := range args {
		fmt.Printf("value: %v\n", value)
	}
}

// can only use ... with final parameter in list
/*
func test(name string, args ...int, strargs ...string) {
	fmt.Printf("name: %v\n", name)
	for _, value := range args {
		fmt.Printf("value: %v\n", value)
	}
}
*/

// https://melonshell.github.io/2020/03/27/go11_3dot/
// https://segmentfault.com/a/1190000020638199
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	name := "jerry"
	int_array := []int{1, 2, 3, 4, 5}
	int_slice_01 := [...]int{1, 2, 3, 4, 5}
	int_slice_02 := int_array[:]

	variableParam("john", 1)
	variableParam("john", 1, 2, 3)
	variableParam(name, int_array...)

	fmt.Printf("type of int_array: %T, type of int_slice_01: %T, type of int_slice_02: %T\n\n", int_array, int_slice_01, int_slice_02)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
