package main

import "fmt"

type IPAddr [4]byte

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

// TODO: 给 IPAddr 添加一个 "String() string" 方法
func (ip IPAddr) String() string {
	return fmt.Sprintf("%v.%v.%v.%v", ip[0], ip[1], ip[2], ip[3])
}

/*

练习：Stringer

通过让 IPAddr 类型实现 fmt.Stringer 来打印点号分隔的地址。

例如，IPAddr{1, 2, 3, 4} 应当打印为 "1.2.3.4"。

*/
func main() {
	hosts := map[string]IPAddr{
		"loopback":  {127, 0, 0, 1},
		"googleDNS": {8, 8, 8, 8},
	}
	for name, ip := range hosts {
		fmt.Printf("%v: %v\n", name, ip)
	}
}
