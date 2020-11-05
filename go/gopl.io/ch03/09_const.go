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

const Pi = 3.14159

const (
	e = 2.71828182845904523536028747135266249775724709369995957496696763
	pi = 3.14159265358979323846264338327950288419716939937510582097494459
)

const (
	a = 1
	b
	c = 2
	d
)

const noDelay time.Duration = 0
const timeout = 5 * time.Minute

/*
常量声明可以使用iota常量生成器初始化,它用于生成一组以相似规则初始化的常量,但是不用每行都写一遍初始化表达式。
在一个const声明语句中,在第一个声明的常量所在的行,iota将会被置为0,然后在每一个有常量声明的行加一。

下面是来自time包的例子,它首先定义了一个Weekday命名类型,然后为一周的每天定义了一个常量,从周日0开始。
在其它编程语言中,这种类型一般被称为枚举类型。

周日将对应0,周一为1,如此等等。
*/
type Weekday int
const (
	Sunday Weekday = iota
	Monday
	Tuesday
	Wednesday
	Thursday
	Friday
	Saturday
)

const  (
	_ = 1 << (10 * iota)
	KiB // 1024
	MiB // 1048576
	GiB // 1073741824
	TiB // 1099511627776 (exceeds 1 << 32)
	PiB // 1125899906842624
	EiB // 1152921504606846976
	ZiB // 1180591620717411303424 (exceeds 1 << 64)
	YiB // 1208925819614629174706176
)

const (
	KB float64 = 1000
	MB float64 = KB * 1000
	GB float64 = MB * 1000
	TB float64 = GB * 1000
	PB float64 = TB * 1000
	EB float64 = PB * 1000
	ZB float64 = EB * 1000
	YB float64 = ZB * 1000
)

const Pi64 float64 = math.Pi

func main() {
	fmt.Printf("Hello world!\n")
	fmt.Printf("Pi = %v\n", Pi)
	fmt.Printf("e = %v\n", e)
	fmt.Printf("pi = %v\n", pi)
	fmt.Printf("a = %v, b = %v, c = %v, d = %v\n", a, b, c, d)

	fmt.Printf("%T %[1]v\n", noDelay) // "time.Duration 0s"
	fmt.Printf("%T %[1]v\n", timeout) // "time.Duration 5m0s"
	fmt.Printf("%T %[1]v\n", time.Minute) // "time.Duration 1m0s"

	fmt.Printf("%v\n", Sunday)
	fmt.Printf("%v\n", Monday)
	fmt.Printf("%v\n", Tuesday)
	fmt.Printf("%v\n", Wednesday)
	fmt.Printf("%v\n", Thursday)
	fmt.Printf("%v\n", Friday)
	fmt.Printf("%v\n", Saturday)

	fmt.Printf("%v\n", KiB)
	fmt.Printf("%v\n", MiB)
	fmt.Printf("%v\n", GiB)
	fmt.Printf("%v\n", TiB)
	fmt.Printf("%v\n", PiB)
	fmt.Printf("%v\n", EiB)
	// fmt.Printf("%v\n", ZiB)
	// fmt.Printf("%v\n", YiB)

	fmt.Println(KB)
	fmt.Println(MB)
	fmt.Println(GB)
	fmt.Println(TB)
	fmt.Println(PB)
	fmt.Println(EB)
	fmt.Println(ZB)
	fmt.Println(YB)

	var x float32 = float32(Pi64)
	var y float64 = Pi64
	var z complex128 = complex128(Pi64)
	fmt.Println(x)
	fmt.Println(y)
	fmt.Println(z)

	/*
	对于常量面值,不同的写法可能会对应不同的类型。例如0、0.0、0i和'\u0000'虽然有着相同的常量值,但是它们分别对应无类型的整数、
	无类型的浮点数、无类型的复数和无类型的字符等不同的常量类型。同样,true和false也是无类型的布尔类型,字符串面值常量是无类型的字符串类型

	前面说过除法运算符/会根据操作数的类型生成对应类型的结果。因此,不同写法的常量除法表达式可能对应不同的结果

	只有常量可以是无类型的。当一个无类型的常量被赋值给一个变量的时候,就像上面的第一行语句,或者是像其余三个语句中右边表达式中含有明确类型的值,
	无类型的常量将会被隐式转换为对应的类型,如果转换合法的话
	*/
	var f float64 = 212
	fmt.Println((f - 32) * 5 / 9) //"100"; (f - 32) * 5 is a float64
	fmt.Println(5 / 9 * (f - 32)) //"0"; 5/9 is an untyped integer, 0
	fmt.Println(5.0 / 9.0 * (f - 32)) //"100"; 5.0/9.0 is an untyped float

	/*
	下面的语句相当于：
	var f float64 = float64(3 + 0i)
	f = float64(2)
	f = float64(1e123)
	f = float64('a')
	*/
	var ff float64 = 3 + 0i //untyped complex -> float64
	fmt.Printf("%T %[1]v\n", ff)
	ff = 2 //untyped integer -> float64
	fmt.Printf("%T %[1]v\n", ff)
	ff = 1e123 //untyped floating-point -> float64
	fmt.Printf("%T %[1]v\n", ff)
	ff = 'a' //untyped rune -> float64
	fmt.Printf("%T %[1]v\n", ff)
}
