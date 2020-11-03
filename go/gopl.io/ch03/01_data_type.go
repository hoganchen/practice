/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"math"
)

func main() {
	fmt.Printf("Hello world!\n")

	/*
	下面的代码演示了如何使用位操作解释uint8类型值的8个独立的bit位。它使用了Printf函数的%b参数打印二进制格式的数字;
	其中%08b中08表示打印至少8个字符宽度,不足的前缀部分用0填充。
	*/
	var x uint8 = 1<<1 | 1<<5
	var y uint8 = 1<<1 | 1<<2

	fmt.Printf("%08b\n", x) // "00100010", the set {1, 5}
	fmt.Printf("%08b\n", y) // "00000110", the set {1, 2}
	fmt.Printf("%08b\n", x&y)  // "00000010", the intersection {1}
	fmt.Printf("%08b\n", x|y)  // "00100110", the union {1, 2, 5}
	fmt.Printf("%08b\n", x^y)  // "00100100", the symmetric difference {2, 5}
	fmt.Printf("%08b\n", x&^y) // "00100000", the difference {5}
	for i := uint(0); i < 8; i++ {
		if x&(1<<i) != 0 { // membership test
			fmt.Println(i) // "1", "5"
		}
	}

	fmt.Printf("%08b\n", x<<1) // "01000100", the set {2, 6}
	fmt.Printf("%08b\n", x>>1) // "00010001", the set {0, 4}

	medals := []string{"gold", "silver", "bronze"}
	for i := len(medals) - 1; i >= 0; i-- {
		fmt.Println(medals[i]) // "bronze", "silver", "gold"
	}

	f := 3.141 // a float64
	i := int(f)
	fmt.Println(f, i) // "3.141 3"
	f = 1.99
	fmt.Println(int(f)) // "1"

	// 通常Printf格式化字符串包含多个%参数时将会包含对应相同数量的额外操作数,但是%之后的 [1] 副词告诉Printf函数再次使用第一个操作数。
	// 第二, %后的 # 副词告诉Printf在用%o、%x或%X输出时生成0、0x或0X前缀
	o := 0666
	fmt.Printf("%d %[1]o %#[1]o\n", o) // "438 666 0666"
	xx := int64(0xdeadbeef)
	fmt.Printf("%d %[1]x %#[1]x %#[1]X\n", xx)

	ascii := 'a'
	unicode := '国'
	newline := '\n'
	fmt.Printf("%d %[1]c %[1]q\n", ascii) //"97 a 'a'"
	fmt.Printf("%d %[1]c %[1]q\n", unicode) //"22269 国 '国'"
	fmt.Printf("%d %[1]q\n", newline) //"10 '\n'"

	for x := 0; x < 8; x++ {
		fmt.Printf("x = %d, e^x = %8.3f\n", x, math.Exp(float64(x)))
	}

	var z float64
	fmt.Println(z, -z, 1/z, -1/z, z/z) //"0 -0 +Inf -Inf NaN"

	// Go语言提供了两种精度的复数类型:complex64和complex128,分别对应float32和float64两种浮点数精度。
	// 内置的complex函数用于构建复数,内建的real和imag函数分别返回复数的实部和虚部
	var xxx complex128 = complex(1, 2) //1+2i
	var yyy complex128 = complex(3, 4) //3+4i
	fmt.Println(xxx*yyy) //"(-5+10i)"
	fmt.Println(real(xxx*yyy)) //"-5"
	fmt.Println(imag(xxx*yyy)) //"10"

	s := "hello, world"
	fmt.Println(len(s)) //"12"
	fmt.Println(s[0], s[7]) //"104 119" ('h' and 'w')
	fmt.Printf("%v, %v\n", s[0], s[7]) //"104 119" ('h' and 'w')
	fmt.Printf("%c, %c\n", s[0], s[7]) //"104 119" ('h' and 'w')

	/*
	字符串的值是不可变的:一个字符串包含的字节序列永远不会被改变,当然我们也可以给一个字符串变量分配一个新字符串值。
	可以像下面这样将一个字符串追加到另一个字符串

	这并不会导致原始的字符串值被改变,但是变量s将因为+=语句持有一个新的字符串值,但是t依然是包含原先的字符串值

	因为字符串是不可修改的,因此尝试修改字符串内部数据的操作也是被禁止的

	不变性意味如果两个字符串共享相同的底层数据的话也是安全的,这使得复制任何长度的字符串代价是低廉的。
	同样,一个字符串s和对应的子字符串切片s[7:]的操作也可以安全地共享相同的内存,因此字符串切片操作代价也是低廉的。
	在这两种情况下都没有必要分配新的内存。
	*/
	ss := "left foot"
	t := ss
	ss += ", right foot"
	fmt.Printf("ss: %v, t: %v\n", ss, t)
	fmt.Printf("%p, %p\n", &ss, &t)
}
