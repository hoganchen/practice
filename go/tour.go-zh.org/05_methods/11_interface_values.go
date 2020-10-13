package main

import (
	"fmt"
	"math"
)

type I interface {
	M()
}

type T struct {
	S string
}

func (t *T) M() {
	fmt.Println(t.S)
}

type F float64

func (f F) M() {
	fmt.Println(f)
}

/*

接口值

接口也是值。它们可以像其它值一样传递。

接口值可以用作函数的参数或返回值。

在内部，接口值可以看做包含值和具体类型的元组：

(value, type)

接口值保存了一个具体底层类型的具体值。

接口值调用方法时会执行其底层类型的同名方法。

*/
func main() {
	var i I

	i = &T{"Hello"}
	describe(i)
	i.M()

	i = F(math.Pi)
	describe(i)
	i.M()
}

func describe(i I) {
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

	fmt.Printf("(%v, %T)\n", i, i)
}
