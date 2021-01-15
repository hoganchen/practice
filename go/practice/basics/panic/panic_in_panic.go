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
Go语言中的panic是可以多次嵌套调用的。一些熟悉Go语言的读者很可能也不知道这个知识点,如下所示的代码就展示了如何在defer函数中多次调用panic

从上述程序的输出,我们可以确定程序多次调用panic也不会影响defer函数的正常执行。所以使用defer进行收尾的工作一般来说都是安全的。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	defer func() {
		if err := recover(); err != nil {
			fmt.Println("Catch error,", err)
		}
	}()

	defer fmt.Println("In main...")
	defer func() {
		defer func() {
			panic("panic again and again...")
		}()

		panic("panic again...")
	}()

	panic("panic once...")

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
