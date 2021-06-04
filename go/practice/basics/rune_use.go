/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"strings"
	"unicode/utf8"
)

/*
output:
utf8Str: I am chinese, utf8Runes: [73 32 97 109 32 99 104 105 110 101 115 101], utf8Bytes: [73 32 97 109 32 99 104 105 110 101 115 101]
gb2312Str: 我是中国人, gb2312Runes: [25105 26159 20013 22269 20154], gb2312Bytes: [230 136 145 230 152 175 228 184 173 229 155 189 228 186 186]

这里也可以很清晰的看出这里的中文字符串每个占三个字节， 区别也就一目了然了。

1.不同字符与获取字符串长度
    获取字符串长度，是字符串操作的重要方法。理论来说，获取字符串长度，只要从头到尾查找一遍就可以了。但遗憾的是，不同字符具有不同的编码格式。拉丁字母一个字符只要一个字节就行，而中文则可能需要两道三个字节；UNICODE把所有字符设置为2个字节，UTF-8格式则把所有字符设置为1--3个字节。
    因此，字符串长度的获得，不等于按字节数查找，而要根据不同字符编码查找。

2.golang中获取字符串长度的方法
    对于中文开发者来说，经常需要对字符串进行长度判断。golang有自己的默认判断长度函数len()；但遗憾的是，len()函数判断字符串长度的时候，是判断字符的字节数而不是字符长度。因此，在中文字符下，应该采用如下方法：
        1)使用 bytes.Count() 统计
        2)使用 strings.Count() 统计
        3)将字符串转换为 []rune 后调用 len 函数进行统计
        4)使用 utf8.RuneCountInString() 统计

3.样例展示
s := "欢迎学习Go的len()函数"
r := []rune(strTest)

fmt.Println(len(r)）

fmt.Println(len(s))

fmt.Println(bytes.Count([]byte(s), nil) - 1)

fmt.Println(strings.Count(s, "") - 1)

fmt.Println(utf8.RuneCountInString(s))
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	intArray := [10]int{1, 2, 5:9}
	intSlice := intArray[:]
	fmt.Printf("type(intArray): %T, intArray: %v, intAarray Address: %p, intSlice address: %p\n", intArray, intArray, &intArray, &intSlice)
	/*
	// byte is an alias for uint8 and is equivalent to uint8 in all ways. It is
	// used, by convention, to distinguish byte values from 8-bit unsigned
	// integer values.
	type byte = uint8

	// rune is an alias for int32 and is equivalent to int32 in all ways. It is
	// used, by convention, to distinguish character values from integer values.
	type rune = int32

	原来是 byte 表示一个字节，rune 表示四个字节，那么就可以得出了结论了，来看一段代码，使用中文字符串
	*/
	utf8Str := "I am chinese"
	// 返回字符串的ASCII码的切片
	utf8Runes := []rune(utf8Str)
	utf8Bytes := []byte(utf8Str)
	fmt.Printf("type(utf8Str): %T, type(utf8Runes): %T, type(utf8Bytes): %T\n", utf8Str, utf8Runes, utf8Bytes)
	fmt.Printf("strings.Count(utf8Str): %v\n", strings.Count(utf8Str, "") - 1)
	fmt.Printf("utf8.RuneCountInString(utf8Str): %v\n", utf8.RuneCountInString(utf8Str))
	fmt.Printf("len(utf8Str): %v, len(utf8Runes): %v, len(utf8Bytes): %v\n", len(utf8Str), len(utf8Runes), len(utf8Bytes))
	fmt.Printf("utf8Str: %v, utf8Runes: %v, utf8Bytes: %v\n", utf8Str, utf8Runes, utf8Bytes)

	gb2312Str := "我是中国人"
	gb2312Runes := []rune(gb2312Str)
	gb2312Bytes := []byte(gb2312Str)
	fmt.Printf("type(gb2312Str): %T, type(gb2312Runes): %T, type(gb2312Bytes): %T\n", gb2312Str, gb2312Runes, gb2312Bytes)
	fmt.Printf("strings.Count(gb2312Str, \"\") - 1: %v\n", strings.Count(gb2312Str, "") - 1)
	fmt.Printf("utf8.RuneCountInString(gb2312Str): %v\n", utf8.RuneCountInString(gb2312Str))
	fmt.Printf("len(gb2312Str): %v, len(gb2312Runes): %v, len(gb2312Bytes): %v\n", len(gb2312Str), len(gb2312Runes), len(gb2312Bytes))
	fmt.Printf("gb2312Str: %v, gb2312Runes: %v, gb2312Bytes: %v\n", gb2312Str, gb2312Runes, gb2312Bytes)

	// 说道这里正好可以提一下 Go 语言切割中文字符串，Go 的字符串截取和切片是一样的 s [n:m] 左闭右开的原则
	// 采用如下方式截取，输出为乱码
	fmt.Printf("gb2312Str[:2]: %v\n", gb2312Str[:2])
	// 采用如下方式截取，则能按照预期截取
	fmt.Printf("gb2312Runes[:2]: %v\n", string(gb2312Runes[:2]))

	/*
	当然你可以使用 [] byte 来截取， 但是这样你就需要知道你的中文字符到底占几个字节， 似乎这种方法不可取，因为你无法得知。
	为什么 s[:n] 无法直接截取呢， 通过实验我猜测如果直接截取的话，底层会将中文转化成 []byte， 而不是 []rune。
	*/
	fmt.Printf("gb2312Bytes[:2 * 3]: %v\n", string(gb2312Bytes[:2 * 3]))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
