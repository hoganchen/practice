/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

const (
	a = "A"
	b = "B"
)

const c = "C"

var (
	v1 int = 1
	v2 int = 2
	v3 int = 3
)
var v int = 5

type T struct{}

type I interface{
	F()
}

func (t T)F() {
	fmt.Printf("F function...\n")
}

/*
Go程序的执行(程序启动)顺序如下:
1. 按顺序导入所有被main包引用的其它包,然后在每个包中执行如下流程:
2. 如果该包又导入了其它的包,则从第一步开始递归执行,但是每个包只会被导入一次。
3. 然后以相反的顺序在每个包中初始化常量和变量,如果该包含有init函数的话,则调用该函数。
4. 在完成这一切之后,main也执行同样的过程,最后调用main函数开始执行程序。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var i int = 5
	j := 5.1
	var k string
	k = "hello"

	fmt.Printf("i = %v, j = %v, k = %v\n", i, j, k)

	var t T
	t.F()
	fmt.Printf("t type: %T, t: %v\n", t, t)

	var ii I
	fmt.Printf("ii type: %T, ii: %v\n", ii, ii)

	ii = t
	ii.F()
	fmt.Printf("ii type: %T, ii: %v\n", ii, ii)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
