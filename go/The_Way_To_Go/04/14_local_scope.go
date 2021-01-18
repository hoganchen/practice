/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

var a = "G"

func n() {fmt.Printf("n func, a = %v\n", a)}

// m和l函数的区别在于是否用:=赋值，:=赋值表示是新建一个本地变量，=赋值表示是修改全局变量
func m() {
	a := "O"
	fmt.Printf("m func, a = %v\n", a)
}

func l() {
	a = "L"
	fmt.Printf("l func, a = %v\n", a)
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	n()
	m()
	n()
	l()
	n()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
