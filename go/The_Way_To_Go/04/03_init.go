/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func init() {
	fmt.Println("The frist init function...")
}

func init() {
	fmt.Println("The second init function...")
}

/*
变量除了可以在全局声明中初始化,也可以在init函数中初始化。这是一类非常特殊的函数,它不能够被人为调用,
而是在每个包完成初始化后自动执行,并且执行优先级比main函数高。
每一个源文件都可以包含一个或多个init函数。初始化总是以单线程执行,并且按照包的依赖关系顺序执行。
一个可能的用途是在开始执行程序之前对数据进行检验或修复,以保证程序状态的正确性。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	fmt.Println("in main function...")

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
