/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
)

/*
一个字符串是包含的只读字节数组,一旦创建,是不可变的。相比之下,一个字节slice的元素则可以自由地修改。

字符串和字节slice之间可以相互转换

从概念上讲,一个[]byte(s)转换是分配了一个新的字节数组用于保存字符串数据的拷贝,然后引用这个底层的字节数组。
编译器的优化可以避免在一些场景下分配和复制字符串数据,但总的来说需要确保在变量b被修改的情况下,原始的s字符串也不会改变。
将一个字节slice转到字符串的string(b)操作则是构造一个字符串拷贝,以确保s2字符串是只读的。
*/
func main() {
	fmt.Printf("Hello world!\n")
	s := "abc"
	b := []byte(s)
	s2 := string(b)

	fmt.Printf("%s\t%[1]v\t%p\n", s, &s)
	fmt.Printf("%s\t%[1]v\t%p\n", b, &b)
	fmt.Printf("%s\t%[1]v\t%p\n", s2, &s2)
}
