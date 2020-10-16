// Ftoc prints two Fahrenheit-to-Celsius conversions.
package main

import "fmt"

/*
var声明语句可以创建一个特定类型的变量,然后给变量附加一个名字,并且设置变量的初始值。变量声明的一般语法如下:
var 变量名字 类型 = 表达式

其中“类型”或“= 表达式”两个部分可以省略其中的一个。如果省略的是类型信息,那么将根据初始化表达式来推导变量的类型信息。
如果初始化表达式被省略,那么将用零值初始化该变量。数值类型变量对应的零值是0,布尔类型变量对应的零值是false,
字符串类型对应的零值是空字符串,接口或引用类型(包括slice、map、chan和函数)变量对应的零值是nil。
数组或结构体等聚合类型对应的零值是每个元素或字段都是对应该类型的零值。

也可以在一个声明语句中同时声明一组变量,或用一组初始化表达式声明并初始化一组变量。如果省略每个变量的类型,
将可以声明多个类型不同的变量(类型由初始化表达式推导):
var i, j, k int					// int, int, int
var b, f, s = true, 2.3, "four"	// bool, float64, string

初始化表达式可以是字面量或任意的表达式。在包级别声明的变量会在main入口函数执行前完成初始化(§2.6.2),
局部变量将在声明语句被执行到的时候完成初始化。

一组变量也可以通过调用一个函数,由函数返回的多个返回值初始化:
var f, err = os.Open(name)	// os.Open returns a file and an error

在函数内部,有一种称为简短变量声明语句的形式可用于声明和初始化局部变量。它以“名字 := 表达式”形式声明变量,变量的类型根据表达式来自动推导。
下面是lissajous函数中的三个简短变量声明语句(§1.4)

这里有一个比较微妙的地方:简短变量声明左边的变量可能并不是全部都是刚刚声明的。如果有一些已经在相同的词法域声明过了(§2.7),那么简短变量声明语句对这些已经声明过的变量就只有赋值行为了。

在下面的代码中,第一个语句声明了in和err两个变量。在第二个语句只声明了out一个变量,然后对已经声明的err进行了赋值操作。
in, err := os.Open(infile)
// ...
out, err := os.Create(outfile)

简短变量声明语句中必须至少要声明一个新的变量,下面的代码将不能编译通过:
f, err := os.Open(infile)
// ...
f, err := os.Create(outfile) // compile error: no new variables
解决的方法是第二个简短变量声明语句改用普通的多重赋值语言。
*/
func main() {
	const freezingF, boilingF = 32.0, 212.0
	fmt.Printf("%g°F = %g°C\n", freezingF, fToC(freezingF)) // "32°F = 0°C"
	fmt.Printf("%g°F = %g°C\n", boilingF, fToC(boilingF))   // "212°F = 100°C"
}

func fToC(f float64) float64 {
	return (f - 32) * 5 / 9
}
