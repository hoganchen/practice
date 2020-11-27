/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func describe(i interface{}) {
	fmt.Printf("Type = %T, value = %v\n", i, i)
}

/*
空接口

具有0个方法的接口称为空接口。它表示为interface {}。由于空接口有0个方法，所有类型都实现了空接口。
https://studygolang.com/articles/12560
*/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	s := "Hello World"
	i := 55
	arr := [...]int{1, 2, 3, 4, 5}
	strt := struct {
		name string
		age int
	}{
		name: "Naveen R",
		age: 38,
	}
	describe(s)
	describe(i)
	describe(arr)
	describe(strt)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
