/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

/*
如果你想要交换两个变量的值,则可以简单地使用a, b = b, a。
(在Go语言中,这样省去了使用交换函数的必要)
空白标识符_也被用于抛弃值,如值5在: _, b = 5, 7中被抛弃。
_实际上是一个只写变量,你不能得到它的值。这样做是因为Go语言中你必须使用所有被声明的变量,但有时你并不需要使用从一个函数得到的所有返回值。
并行赋值也被用于当一个函数返回多个返回值时,比如这里的val和错误err是通过调用Func1函数同时得到: val, err = Func1(var1)。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var a, b, c int

	a, b, c = 1, 2, 3
	i, j, k := 5, 7.2, "string"

	fmt.Printf("a = %v, b = %v, c = %v\n", a, b, c)
	fmt.Printf("i = %v, j = %v, k = %v\n", i, j, k)

	a, b = b, a

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
