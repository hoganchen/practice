/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"unicode/utf8"
	"math"
)

/*
%d										十进制整数
%x, %o, %b								十六进制,八进制,二进制整数。
%f, %g, %e								浮点数: 3.141593 3.141592653589793 3.141593e+00
%t										布尔:true或false
%c										字符(rune) (Unicode码点)
%s										字符串
%q										带双引号的字符串"abc"或带单引号的字符'c'
%v										变量的自然形式(natural format)
%T										变量的类型
%%										字面上的百分号标志(无操作数)

在一个双引号包含的字符串面值中,可以用以反斜杠 \ 开头的转义序列插入任意的数据。下面的换行、回车和制表符等是常见的ASCII控制代码的转义方式
\a						响铃
\b						退格
\f						换页
\n						换行
\r						回车
\t						制表符
\v						垂直制表符
\'						单引号 (只用在 '\'' 形式的rune符号面值中)
\"						双引号 (只用在 "..." 形式的字符串面值中)
\\						反斜杠

可以通过十六进制或八进制转义在字符串面值包含任意的字节。一个十六进制的转义形式是\xhh,其中两个h表示十六进制数字(大写或小写都可以)。
一个八进制转义形式是\ooo,包含三个八进制的o数字(0到7),但是不能超过 \377 (译注:对应一个字节的范围,十进制为255)。每一个单一的字节表达一个特定的值。
*/
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
	// ss[0] = 'L' //compile error: cannot assign to s[0]
	t := ss
	ss += ", right foot"
	fmt.Printf("ss: %v, t: %v\n", ss, t)
	fmt.Printf("%p, %p\n", &ss, &t)

	// 中文字符占3个字节
	sss := "Hello, 世界"
	fmt.Println(len(sss)) //"13"
	fmt.Println(utf8.RuneCountInString(sss)) //"9"

	/*
	每一次调用DecodeRuneInString函数都返回一个r和长度,r对应字符本身,长度对应r采用UTF8编码后的编码字节数目。
	长度可以用于更新第i个字符在字符串中的字节索引位置。但是这种编码方式是笨拙的,我们需要更简洁的语法。
	幸运的是,Go语言的range循环在处理字符串的时候,会自动隐式解码UTF8字符串。下面的循环运行如图3.5所示;需要注意的是对于非ASCII,索引更新的步长将超过1个字节
	*/
	for i := 0; i < len(sss); {
		r, size := utf8.DecodeRuneInString(sss[i:])
		fmt.Printf("%d\t%c\tsize:%v\n", i, r, size)
		i += size
	}

	// 中文字符占3个字节，所以第一个中文字符'世'与第二个中文字符'界'之间的索引差了3个字节
	for index, value := range sss {
		fmt.Printf("%d\t%c\n", index, value)
	}

	for i, r := range "Hello, 世界" {
		fmt.Printf("%d\t%q\t%d\t%[3]x\n", i, r, r)
	}

	ssss := "プログラム"
	fmt.Printf("% x\n", ssss) //"e3 83 97 e3 83 ad e3 82 b0 e3 83 a9 e3 83 a0"
	r := []rune(ssss)
	fmt.Printf("%x\n", r) //"[30d7 30ed 30b0 30e9 30e0]"
	fmt.Println(string(r)) //"プログラム"
	fmt.Println(string(65)) //"A",not "65"
	fmt.Println(string(0x4eac)) //"京"
	fmt.Println(string(0x30e0)) //"ム"
	fmt.Println(string(0x754c)) //"界"
	// 如果对应码点的字符是无效的,则用'\uFFFD'无效字符作为替换
	fmt.Println(string(1234567)) // "�"
}

func HasPrefix(s, prefix string) bool {
	return len(s) >= len(prefix) && s[:len(prefix)] == prefix
}

func HasSuffix(s, suffix string) bool {
	return len(s) >= len(suffix) && s[len(s)-len(suffix):] == suffix
}

func Contains(s, substr string) bool {
	for i := 0; i < len(s); i++ {
		if HasPrefix(s[i:], substr) {
			return true
		}
	}
	return false
}
