// Copyright © 2016 Alan A. A. Donovan & Brian W. Kernighan.
// License: https://creativecommons.org/licenses/by-nc-sa/4.0/

// See page 8.

// Echo3 prints its command-line arguments.
package main

import (
	"fmt"
	"os"
	"strings"
)

//!+
func main() {
	/*
	如前文所述,每次循环迭代字符串s的内容都会更新。 +=连接原字符串、空格和下个参数,产生新字符串, 并把它赋值给s。
	s原来的内容已经不再使用,将在适当时机对它进行垃圾回收。

	如果连接涉及的数据量很大,这种方式代价高昂。一种简单且高效的解决方案是使用strings包的Join函数
	*/
	fmt.Println(strings.Join(os.Args[1:], " "))
}

//!-
