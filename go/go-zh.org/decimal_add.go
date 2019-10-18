package main

import "fmt"

/*
Go语言的标准输出流在打印到屏幕时有些参数跟别的语言（比如C#和Java）不同，下面是我整理的一些常用的格式化输入操作。
General

    %v 以默认的方式打印变量的值
    %T 打印变量的类型

Integer

    %+d 带符号的整型，fmt.Printf("%+d", 255)输出+255
    %q 打印单引号
    %o 不带零的八进制
    %#o 带零的八进制
    %x 小写的十六进制
    %X 大写的十六进制
	%#x 带0x的十六进制
     %U 打印Unicode字符
    %#U 打印带字符的Unicode
    %b 打印整型的二进制

Integer width

    %5d 表示该整型最大长度是5，下面这段代码

      fmt.Printf("|%5d|", 1)
      fmt.Printf("|%5d|", 1234567)

输出结果如下：

|    1|
|1234567|

    %-5d则相反，打印结果会自动左对齐
    %05d会在数字前面补零。

Float

    %f (=%.6f) 6位小数点
    %e (=%.6e) 6位小数点（科学计数法）
    %g 用最少的数字来表示
    %.3g 最多3位数字来表示
    %.3f 最多3位小数来表示

String

    %s 正常输出字符串
    %q 字符串带双引号，字符串中的引号带转义符
    %#q 字符串带反引号，如果字符串内有反引号，就用双引号代替
    %x 将字符串转换为小写的16进制格式
    %X 将字符串转换为大写的16进制格式
    % x 带空格的16进制格式

String Width (以5做例子）

    %5s 最小宽度为5
    %-5s 最小宽度为5（左对齐）
    %.5s 最大宽度为5
    %5.7s 最小宽度为5，最大宽度为7
    %-5.7s 最小宽度为5，最大宽度为7（左对齐）
    %5.3s 如果宽度大于3，则截断
    %05s 如果宽度小于5，就会在字符串前面补零

Struct

    %v 正常打印。比如：{sam {12345 67890}}
    %+v 带字段名称。比如：{name:sam phone:{mobile:12345 office:67890}
    %#v 用Go的语法打印。
    比如main.People{name:”sam”, phone:main.Phone{mobile:”12345”, office:”67890”}}

Boolean

    %t 打印true或false

Pointer

    %p 带0x的指针
    %#p 不带0x的指针

参考

	fmt.Printf format reference (cheat sheet)
	http://golang-examples.tumblr.com/post/86795367134/fmt-printf-format-reference-cheat-sheet
*/

func decimal_add_01(x float32, interval int) float32 {
	// sum := 0.0
	var sum float32 = 0.0

	for i := 0; i < interval; i++ {
		sum += x
	}

	return sum
}

func decimal_add_02(x float64, interval int) float64 {
	sum := 0.0
	// var sum float32 = 0.0

	for i := 0; i < interval; i++ {
		sum += x
	}

	return sum
}

func main() {
	fmt.Printf("decimal_add_01(0.1, 100) = %v, type: %T\n", decimal_add_01(0.1, 100), decimal_add_01(0.1, 100))
	fmt.Println("decimal_add_01(0.1, 100) =", decimal_add_01(0.1, 100))

	fmt.Printf("decimal_add_02(0.1, 100) = %v, type: %T\n", decimal_add_02(0.1, 100), decimal_add_02(0.1, 100))
	fmt.Println("decimal_add_02(0.1, 100) =", decimal_add_02(0.1, 100))
}
