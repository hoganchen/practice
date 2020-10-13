package main

import "fmt"

/*
修改映射

在映射 m 中插入或修改元素：

m[key] = elem

获取元素：

elem = m[key]

删除元素：

delete(m, key)

通过双赋值检测某个键是否存在：

elem, ok = m[key]

若 key 在 m 中，ok 为 true ；否则，ok 为 false。

若 key 不在映射中，那么 elem 是该映射元素类型的零值。

同样的，当从映射中读取某个不存在的键时，结果是映射的元素类型的零值。

注 ：若 elem 或 ok 还未声明，你可以使用短变量声明：

elem, ok := m[key]
*/
func main() {
	m := make(map[string]int)

	m["Answer"] = 42
	fmt.Println("The value:", m["Answer"])

	m["Answer"] = 48
	fmt.Println("The value:", m["Answer"])

	delete(m, "Answer")
	fmt.Println("The value:", m["Answer"])

	v, ok := m["Answer"]
	fmt.Println("The value:", v, "Present?", ok)

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
	if ok == true {
		fmt.Printf("The value: %v, Present, ok = %v\n", v, ok)
		fmt.Printf("The value: %d, Present, ok = %t\n", v, ok)
	} else {
		fmt.Printf("The value: %v, No Present, ok = %v\n", v, ok)
		fmt.Printf("The value: %d, No Present, ok = %t\n", v, ok)
	}

	m["Answer"] = 96
	v, ok = m["Answer"]
	fmt.Println("The value:", v, "Present?", ok)
}
