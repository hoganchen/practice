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
从代码的输出我们会发现,defer传入的函数不是在退出代码块的作用域时执行的,它只会在当前函数和方法返回之前被调用。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	for i := 0; i < 5; i++ {
		defer fmt.Println("for defer, i =", i)
	}

	defer func() {
		for i := 0; i < 5; i++ {
			fmt.Println("defer func, i =", i)
		}
	}()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
