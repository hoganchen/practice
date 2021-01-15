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
包是结构化代码的一种方式:每个程序都由包(通常简称为pkg)的概念组成,可以使用自身的包或者从其它包中导入内容。

如同其它一些编程语言中的类库或命名空间的概念,每个Go文件都属于且仅属于一个包。一个包可以由许多以.go为扩展名的源文件组成,
因此文件名和包名一般来说都是不相同的。

你必须在源文件中非注释的第一行指明这个文件属于哪个包,如:package main。package main表示一个可独立执行的程序,
每个Go应用程序都包含一个名为main的包。

一个应用程序可以包含不同的包,而且即使你只使用main包也不必把所有的代码都写在一个巨大的文件里:你可以用一些较小的文件,
并且在每个文件非注释的第一行都使用package main来指明这些文件都属于main包。如果你打算编译包名不是为main的源文件,
如pack1,编译后产生的对象文件将会是pack1.a而不是可执行程序。另外要注意的是,所有的包名都应该使用小写字母。

如果需要多个包,它们可以被分别导入:
1. import "fmt"
2. import "os"
或:
1. import "fmt"; import "os"
但是还有更短且更优雅的方法(被称为因式分解关键字,该方法同样适用于const、var和type的声明或定义):
1. import(
2.     "fmt"
3.     "os"
4. )
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
