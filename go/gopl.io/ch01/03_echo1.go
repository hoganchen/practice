// Copyright © 2016 Alan A. A. Donovan & Brian W. Kernighan.
// License: https://creativecommons.org/licenses/by-nc-sa/4.0/

// See page 4.
//!+

// Echo1 prints its command-line arguments.
package main

import (
	"fmt"
	"os"
)

func main() {
	var s, sep string
	fmt.Printf("len(os.Args): %v, type(os.Args): %T, os.Args: %s\n", len(os.Args), os.Args, os.Args)

	// 符号 := 是短变量声明(short variable declaration)的一部分, 这是定义一个或多个变量并根据它们的初始值为这些变量赋予适当类型的语句。
	/*
	for	initialization; condition; post {
		// zero or more statements
	}
	for循环三个部分不需括号包围。大括号强制要求, 左大括号必须和post语句在同一行。

	initialization语句是可选的,在循环开始前执行。initalization如果存在,必须是一条简单语句(simple statement),
	即,短变量声明、自增语句、赋值语句或函数调用。condition是一个布尔表达式(boolean expression),其值在每次循环迭代开始时计算。
	如果为true则执行循环体语句。post语句在循环体执行结束后执行,之后再次对conditon求值。condition值为false时,循环结束。

	for循环的这三个部分每个都可以省略,如果省略initialization和post,分号也可以省略:
	// a traditional "while" loop
	for condition   {
		// ...
	}

	如果连condition也省略了,像下面这样:
	//a traditional infinite loop
	for {
		// ...
	}
	*/
	for i := 1; i < len(os.Args); i++ {
		fmt.Printf("os.Args[%v]: %v\n", i, os.Args[i])
		s += sep + os.Args[i]
		sep = " "
	}
	fmt.Println(s)
}

//!-
