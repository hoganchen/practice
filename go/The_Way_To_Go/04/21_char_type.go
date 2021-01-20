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
严格来说,这并不是Go语言的一个类型,字符只是整数的特殊用例。byte类型是uint8的别名,对于只占用1个字节的传统ASCII编码的字符来说,
完全没有问题。例如:var ch byte = 'A';字符使用单引号括起来。

在ASCII码表中,A的值是65,而使用16进制表示则为41,所以下面的写法是等效的:
1. var ch byte = 65 或 var ch byte = '\x41'
(\x总是紧跟着长度为2的16进制数)

另外一种可能的写法是\后面紧跟着长度为3的八进制数,例如:\377

不过Go同样支持Unicode(UTF-8),因此字符同样称为Unicode代码点或者runes,并在内存中使用int来表示。
在文档中,一般使用格式U+hhhh来表示,其中h表示一个16进制数。其实rune也是Go当中的一个类型,并且是int32的别名。

在书写Unicode字符时,需要在16进制数之前加上前缀\u或者\U。

因为Unicode至少占用2个字节,所以我们使用int16或者int类型来表示。
如果需要使用到4字节,则会加上\U前缀;前缀\u则总是紧跟着长度为4的16进制数,前缀\U紧跟着长度为8的16进制数。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var ch byte = 65
	var char byte = '\x41'
	cr := 'A'
	var ocr byte = '\101' //python oct(65)
	/*
	https://tonybai.com/2019/10/27/some-changes-in-go-1-13/
	https://leileiluoluo.com/posts/go1dot13-number-literals.html
	go 1.13支持如下格式
	*/
	// var bcr = 0b1000001

	// 通常Printf格式化字符串包含多个%参数时将会包含对应相同数量的额外操作数,但是%之后的 [1] 副词告诉Printf函数再次使用第一个操作数。
	// 第二, %后的 # 副词告诉Printf在用%o、%x或%X输出时生成0、0x或0X前缀
	fmt.Printf("ch type(%%T): %[1]T, ch value(%%v): %#[1]v, ch value(%%x): %#[1]x, ch value(%%c): %[1]c, ch value(%%b): %[1]b, ch value(%%o): %#[1]o\n", ch)
	fmt.Printf("char type(%%T): %[1]T, char value(%%v): %#[1]v, char value(%%x): %#[1]x, char value(%%c): %[1]c, char value(%%b): %[1]b, char value(%%o): %#[1]o\n", char)
	fmt.Printf("cr type(%%T): %[1]T, cr value(%%v): %#[1]v, cr value(%%x): %#[1]x, cr value(%%c): %[1]c, cr value(%%b): %[1]b, cr value(%%o): %#[1]o\n", cr)
	fmt.Printf("ocr type(%%T): %[1]T, ocr value(%%v): %#[1]v, ocr value(%%x): %#[1]x, ocr value(%%c): %[1]c, ocr value(%%b): %[1]b, ocr value(%%o): %#[1]o\n", ocr)
	// fmt.Printf("bcr type(%%T): %[1]T, bcr value(%%v): %#[1]v, bcr value(%%x): %#[1]x, bcr value(%%c): %[1]c, bcr value(%%b): %[1]b, bcr value(%%o): %#[1]o\n", bcr)

	var ch1 int = '\u0041'
	var ch2 int = '\u03B2'
	var ch3 int = '\U00101234'

	/*
	格式化说明符%c用于表示字符;当和字符配合使用时,%v或%d会输出用于表示该字符的整数;%U输出格式为U+hhhh的字符串
	*/
	fmt.Printf("ch1 = %d, ch2 = %d, ch3 = %d\n", ch1, ch2, ch3)
	fmt.Printf("ch1 = %c, ch2 = %c, ch3 = %c\n", ch1, ch2, ch3)
	fmt.Printf("ch1 = %X, ch2 = %X, ch3 = %X\n", ch1, ch2, ch3)
	fmt.Printf("ch1 = %U, ch2 = %U, ch3 = %U\n", ch1, ch2, ch3)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
