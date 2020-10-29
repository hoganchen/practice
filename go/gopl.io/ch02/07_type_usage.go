/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"reflect"
)

type Celsius float64    // 摄氏温度
type Fahrenheit float64 // 华氏温度

const (
    AbsoluteZeroC Celsius = -273.15 // 绝对零度
    FreezingC Celsius = 0           // 结冰点温度
    BoilingC Celsius = 100          // 沸水温度
)

func CToF(c Celsius) Fahrenheit {
    return Fahrenheit(c * 9/5 + 32)
}

func FToC(f Fahrenheit) Celsius {
    return Celsius((f - 32) * 5/9)
}

func typeof(v interface{}) string {
    return fmt.Sprintf("%T", v)
}

// 下面的声明语句,Celsius类型的参数c出现在了函数名的前面,表示声明的是Celsius类型的一个叫名叫String的方法,该方法返回该类型对象c带着°C温度单位的字符串
func (c Celsius) String() string {
	return fmt.Sprintf("value: %g°C", c)
}

func main() {
	fmt.Printf("%g\n", BoilingC - FreezingC)	//"100" °C
	boilingF := CToF(BoilingC)
	fmt.Printf("%g\n", boilingF - CToF(FreezingC))	//"180" °F
	fmt.Printf("%g\n", float64(boilingF) - float64(FreezingC))		//compile error: type mismatch
	// fmt.Printf("%g\n", boilingF - FreezingC)		//compile error: type mismatch

	// 获取变量的类型
	fmt.Println(typeof(FreezingC))
	fmt.Println(typeof(BoilingC))

	// 反射，获取变量的类型
	fmt.Println(reflect.TypeOf(FreezingC))
	fmt.Println(reflect.TypeOf(BoilingC))

	var c Celsius
	var f Fahrenheit
	fmt.Println(c == 0)				// "true"
	fmt.Println(f >= 0)				// "true"
	// fmt.Println(c == f)				// compile error: type mismatch
	fmt.Printf("c = %v, Celsius(f) = %v, c == Celsius(f)? %v\n", c, Celsius(f), c == Celsius(f))	// "true"!
	fmt.Println(c == Celsius(f))	// "true"!

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
	// 许多类型都会定义一个String方法,因为当使用fmt包的打印方法时,将会优先使用该类型对应的String方法返回的结果打印
	xx := FToC(212.0)
	fmt.Println(xx.String())	//"100°C"
	fmt.Printf("%v\n",	xx)		//"100°C"; no need to call String explicitly(无需显式调用string方法)
	fmt.Printf("%s\n",	xx)		//"100°C"
	fmt.Println(xx)				//"100°C"
	fmt.Printf("%g\n",	xx)		//"100"; does not call String
	fmt.Println(float64(xx))	//"100"; does not call String
}
