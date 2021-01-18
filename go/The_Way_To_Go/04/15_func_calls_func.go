/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

var a string

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	a = "G"
	fmt.Printf("main func, a = %v\n", a)
	f1()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}

func f1() {
	a := "O"
	fmt.Printf("f1 func, a = %v\n", a)
	f2()
	f3(a)
}

func f2() {
	fmt.Printf("f2 func, a = %v\n", a)
}

func f3(a string) {
	fmt.Printf("f3 func, a = %v\n", a)
}
