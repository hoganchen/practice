/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"math/rand"
)

/*
每一个case分支都是唯一的,从上至下逐一测试,直到匹配为止。
(Go语言使用快速的查找算法来测试switch条件与case分支的匹配情况,直到算法匹配到某个case或者进入default条件为止。)
一旦成功地匹配到某个分支,在执行完相应代码后就会退出整个switch代码块,也就是说您不需要特别使用break语句来表示结束。
因此,程序也不会自动地去执行下一个分支的代码。如果在执行完每个分支的代码后,还希望继续执行后续分支的代码,
可以使用fallthrough关键字来达到目的。

在case...:语句之后,您不需要使用花括号将多行语句括起来,但您可以在分支中进行任意形式的编码。
当代码块只有一行时,可以直接放置在case语句之后。

您同样可以使用return语句来提前结束代码块的执行。当您在switch语句块中使用return语句,并且您的函数是有返回值的,
您还需要在switch之后添加相应的return语句以确保函数始终会返回。

可选的default分支可以出现在任何顺序,但最好将它放在最后。它的作用类似与if-else语句中的else,表示不符合任何已给出条件时,执行相关语句。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	rand.Seed(int64(time.Now().Nanosecond()))
	// v := rand.Intn(4)

	switch v := rand.Intn(4); v {
	case 0:
		fmt.Println("case 0, fallthrough to case 1")
		fallthrough
	case 1:
		fmt.Println("case 1")
	case 2:
		fmt.Println("case 2")
	default:
		fmt.Println("default")
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
