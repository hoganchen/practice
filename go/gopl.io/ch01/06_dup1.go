// Copyright © 2016 Alan A. A. Donovan & Brian W. Kernighan.
// License: https://creativecommons.org/licenses/by-nc-sa/4.0/

// See page 8.
//!+

// Dup1 prints the text of each line that appears more than
// once in the standard input, preceded by its count.
package main

import (
	"bufio"
	"fmt"
	"os"
)

/*
map存储了键/值(key/value)的集合,对集合元素,提供常数时间的存、取或测试操作。键可以是任意类型,只要其值能用==运算符比较,
最常见的例子是字符串;值则可以是任意类型。这个例子中的键是字符串,值是整数。内置函数make创建空map,此外,它还有别的作用。

(译注:从功能和实现上说, Go的map类似于Java语言中的HashMap,Python语言中的dict,Lua语言中的table,通常使用hash实现。
遗憾的是,对于该词的翻译并不统一,数学界术语为映射,而计算机界众说纷纭莫衷一是。为了防止对读者造成误解,保留不译。)
*/

/*
%d										十进制整数
%x,	%o,	%b								十六进制,八进制,二进制整数。
%f,	%g,	%e								浮点数:	3.141593	3.141592653589793	3.141593e+00
%t										布尔:true或false
%c										字符(rune)	(Unicode码点)
%s										字符串
%q										带双引号的字符串"abc"或带单引号的字符'c'
%v										变量的自然形式(natural	format)
%T										变量的类型
%%										字面上的百分号标志(无操作数)
*/
func main() {
	// ctrl + d结束输入
	/*
	继续来看bufio包,它使处理输入和输出方便又高效。Scanner类型是该包最有用的特性之一,它读取输入并将其拆成行或单词;
	通常是处理行形式的输入最简单的方法。

	程序使用短变量声明创建bufio.Scanner类型的变量input。

	input := bufio.NewScanner(os.Stdin)

	该变量从程序的标准输入中读取内容。每次调用input.Scanner,即读入下一行,并移除行末的换行符;读取的内容可以调用input.Text()得到。
	Scan函数在读到一行时返回true,在无输入时返回false。
	*/
	counts := make(map[string]int)
	input := bufio.NewScanner(os.Stdin)
	for input.Scan() {
		counts[input.Text()]++
	}
	// NOTE: ignoring potential errors from input.Err()
	// range用于map上，产生key，value对
	for line, n := range counts {
		if n > 1 {
			fmt.Printf("%d\t%s\n", n, line)
		}
	}
}

//!-
