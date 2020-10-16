// Copyright © 2016 Alan A. A. Donovan & Brian W. Kernighan.
// License: https://creativecommons.org/licenses/by-nc-sa/4.0/

// See page 6.
//!+

// Echo2 prints its command-line arguments.
package main

import (
	"fmt"
	"os"
)

/*
每次循环迭代, range产生一对值;索引以及在该索引处的元素值。这个例子不需要索引, 但range的语法要求, 要处理元素, 必须处理索引。
一种思路是把索引赋值给一个临时变量, 如temp,  然后忽略它的值,但Go语言不允许使用无用的局部变量(local variables),因为这会导致编译错误。

Go语言中这种情况的解决方法是用空标识符(blank identifier),即_(也就是下划线)。空标识符可用于任何语法需要变量名但程序逻辑不需要的时候,
例如, 在循环里,丢弃不需要的循环索引,保留元素值。大多数的Go程序员都会像上面这样使用range和_写echo程序,
因为隐式地而非显示地索引os.Args,容易写对。

echo的这个版本使用一条短变量声明来声明并初始化s和seps,也可以将这两个变量分开声明,声明一个变量有好几种方式,下面这些都等价:
s := ""
var s string
var s = ""
var s string = ""

用哪种不用哪种,为什么呢?第一种形式,是一条短变量声明,最简洁,但只能用在函数内部,而不能用于包变量。
第二种形式依赖于字符串的默认初始化零值机制,被初始化为""。第三种形式用得很少,除非同时声明多个变量。
第四种形式显式地标明变量的类型,当变量类型与初值类型相同时,类型冗余,但如果两者类型不同,变量类型就必须了。
实践中一般使用前两种形式中的某个,初始值重要的话就显式地指定变量的类型,否则使用隐式初始化。
*/
func main() {
	s, sep := "", ""

	// for循环的另一种形式, 在某种数据类型的区间(range)上遍历,如字符串或切片。
	for _, arg := range os.Args[1:] {
		s += sep + arg
		sep = " "
	}
	fmt.Println(s)

	s, sep = "", ""
	for i, arg := range os.Args[1:] {
		s += sep + arg
		sep = " "
		fmt.Printf("i = %v, arg = %v\n", i, arg)
	}
	fmt.Println(s)

}

//!-
