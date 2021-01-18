/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"math"
)

/*
Go也有基于架构的类型,例如:int、uint和uintptr。
这些类型的长度都是根据运行程序所在的操作系统类型所决定的:
int和uint在32位操作系统上,它们均使用32位(4个字节),在64位操作系统上,它们均使用64位(8个字节)。
uintptr的长度被设定为足够存放一个指针即可。

Go语言中没有float类型。
与操作系统架构无关的类型都有固定的大小,并在类型的名称中就可以看出来:

整数:
int8(-128 -> 127)
int16(-32768 -> 32767)
int32(-2,147,483,648 -> 2,147,483,647)
int64(-9,223,372,036,854,775,808 -> 9,223,372,036,854,775,807)

无符号整数:
uint8(0 -> 255)
uint16(0 -> 65,535)
uint32(0 -> 4,294,967,295)
uint64(0 -> 18,446,744,073,709,551,615)

浮点型(IEEE-754标准):
float32(+- 1e-45 -> +- 3.4 * 1e38)
float64(+- 5 1e-324 -> 107 1e308)
int型是计算最快的一种类型。

整型的零值为0,浮点型的零值为0.0。
float32精确到小数点后7位,float64精确到小数点后15位。由于精确度的缘故,你在使用==或者!=来比较浮点数时应当非常小心。
你最好在正式使用前测试对于精确度要求较高的运算。

你应该尽可能地使用float64,因为math包中所有有关数学运算的函数都会要求接收这个类型。
你可以通过增加前缀0来表示8进制数(如:077),增加前缀0x来表示16进制数(如:0xFF),以及使用e来表示10的连乘(如:1e3 = 1000,或者6.022e23 = 6.022 x 1e23)。

你可以使用a := uint64(0)来同时完成类型转换和赋值操作,这样a的类型就是uint64。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var a int
	var b int32

	a = 16
	// b = a + a // cannot use a + a (type int) as type int32 in assignment
	b = int32(a + a)
	b = b + 5
	c := uint32(math.Abs(-5.5))
	fmt.Println("a =", a, "b =", b, "c =", c)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
