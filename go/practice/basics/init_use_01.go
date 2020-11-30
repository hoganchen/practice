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
	fmt.Printf("This is the frist init func...\n\n")
}

func init() {
	fmt.Printf("This is the second init func...\n\n")
}

/*
对于在包级别声明的变量,如果有初始化表达式则用表达式初始化,还有一些没有初始化表达式的,例如某些表格数据初始化并不是一个简单的赋值过程。
在这种情况下,我们可以用一个特殊的init初始化函数来简化初始化工作。每个文件都可以包含多个init初始化函数

这样的init初始化函数除了不能被调用或引用外,其他行为和普通函数类似。在每个文件中的init初始化函数,
在程序开始执行时按照它们声明的顺序被自动调用。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
