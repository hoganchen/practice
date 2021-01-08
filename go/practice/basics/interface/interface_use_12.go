/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func Print(v interface{}) {
	fmt.Printf("&v: %p, type(v): %T, v: %v\n", &v, v, v)
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	// type Test struct{x int; y int}
	type Test struct{x, y int}
	// v := Test{1, 2}
	v := Test{y:2}
	fmt.Printf("&v: %p, type(v): %T, v: %v\n", &v, v, v)

	Print(v)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
