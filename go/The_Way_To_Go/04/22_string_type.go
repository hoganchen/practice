/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"unsafe"
)

/*
字符串是一种值类型,且值不可变,即创建某个文本后你无法再次修改这个文本的内容;更深入地讲,字符串是字节的定长数组。

Go支持以下2种形式的字面值:
解释字符串:
该类字符串使用双引号括起来,其中的相关的转义字符将被替换,这些转义字符包括:
\n: 换行符
\r: 回车符
\t: tab键
\u或\U: Unicode字符
\\: 反斜杠自身
非解释字符串:
该类字符串使用反引号括起来,支持换行

和C/C++不一样,Go中的字符串是根据长度限定,而非特殊字符\0。

string类型的零值为长度为零的字符串,即空字符串""。

一般的比较运算符(==、!=、<、<=、>=、>)通过在内存中按字节比较来实现字符串的对比。
你可以通过函数len()来获取字符串所占的字节长度,例如:len(str)。

字符串的内容(纯字节)可以通过标准索引法来获取,在中括号[]内写入索引,索引从0开始计数:
字符串str的第1个字节: str[0]
第i个字节: str[i-1]
最后1个字节: str[len(str)-1]
需要注意的是,这种转换方案只对纯ASCII码的字符串有效。
注意事项：获取字符串中某个字节的地址的行为是非法的,例如:&str[i]。

字符串在Go语言中的接口其实非常简单,每一个字符串在运行时都会使用如下的StringHeader结构体表示,
在运行时包的内部其实有一个私有的结构stringHeader,它有着完全相同的结构只是用于存储数据的Data字段使用了unsafe.Pointer类型:
1. type StringHeader struct {
2. Data uintptr
3. Len int
4. }
我们会经常会说字符串是一个只读的切片类型,这是因为切片在Go语言的运行时表示与字符串高度相似:
1. type SliceHeader struct {
2. Data uintptr
3. Len int
4. Cap int
5. }
与切片的结构体相比,字符串少了一个表示容量的Cap字段,因为字符串作为只读的类型,
我们并不会直接向字符串直接追加元素改变其本身的内存空间,所有在字符串上执行的写入操作实际都是通过拷贝实现的。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var str string = "This is a raw string\nThis is another new line string. tab\ttab, % character, \\ character, \u0041 unicode character"
	fmt.Printf("%v\n", str)

	/*
	https://www.delftstack.com/zh/howto/go/how-to-write-multiline-strings-in-go/
	反引号，多行字符串，忽略转义字符
	*/
	var sr string = `This is the frist line\n
	This is the second line,
	line...\n
	This is the third line.\n`
	fmt.Printf("%v\n\n", sr)

	/*
	https://www.delftstack.com/zh/howto/go/how-to-write-multiline-strings-in-go/
	双引号，多行字符串，处理转义字符
	*/
	var multiStr string = "This is the frist line.\n" +
	"This is the second line, " + "extend the second line...\n" +
	"This is the third line.\n\n"
	fmt.Printf("%v\n\n", multiStr)
	fmt.Printf("len(multiStr) = %v\n", len(multiStr))

	for i := range multiStr {
		fmt.Printf("%v ", i)
	}

	fmt.Printf("\n\n")

	for i := 0; i < len(multiStr); i++ {
		fmt.Printf("%c ", multiStr[i])
	}

	fmt.Printf("\n\n")

	fmt.Printf("&multiStr data struct address: %p\n", &multiStr)
	// cannot take the address of multiStr[1]
	// fmt.Printf("&multiStr[1]: %p\n", &multiStr[1])
	c := (* int64)(unsafe.Pointer((&multiStr)))
	fmt.Printf("c = %p, *c = %#x\n", c, *c)
	cptr := (* int64)(unsafe.Pointer(&multiStr))

	// possible misuse of unsafe.Pointer warning
	// https://blog.gopheracademy.com/advent-2019/safe-use-of-unsafe-pointer/
	cData := (* int64)(unsafe.Pointer(uintptr(*cptr)))
	fmt.Printf("multiStr data address: %p\n", cData)
	cLen := (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(cptr)) + uintptr(8)))
	fmt.Printf("multiStr data len address: %p, multiStr data len: %v\n", cLen, *cLen)

	for i := 0; i < 32; i++ {
		pLen := (* byte)(unsafe.Pointer(uintptr(unsafe.Pointer(cptr)) + uintptr(i * 1)))
		fmt.Printf("%p , %#x\n", pLen, *pLen)
	}

	for i := 0; i < len(multiStr); i++ {
		// p := (* byte)(unsafe.Pointer(uintptr(*cptr) + uintptr(i) * unsafe.Sizeof(uint8(0))))
		p := (* byte)(unsafe.Pointer(uintptr(*cptr) + uintptr(i * 1)))
		// fmt.Printf("address: %p, value: %c \\", p, *p)
		fmt.Printf("%c", *p)
	}

	fmt.Printf("\n\n")

	// 由于string，slice都有自己的数据结构，取地址操作是获取对应数据结构的地址，所以不能从string类型的array或者slice中获取元素的地址
	// 但是可以根据string，int类型的数据结构，得到Data的地址，也可以获得len，cap的地址，然后按照对应的格式即可获取数据
	sli := multiStr[:]
	ptr := (* int64)(unsafe.Pointer(&sli))
	fmt.Printf("ptr: %p, sli data struct address: %p\n", ptr, &sli)
	fmt.Printf("sli data struct address: %p, sli[0] = %c\n", &sli, sli[0])
	fmt.Printf("sli data address: 0x%x\n", *ptr)
	fmt.Printf("sli data address: %#x\n", *ptr)

	slLen := (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(ptr)) + uintptr(8)))
	fmt.Printf("sli data len address: %p, sli data len: %v\n", slLen, *slLen)

	slCap := (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(ptr)) + uintptr(16)))
	fmt.Printf("sli data cap address: %p, sli data cap: %#[2]v, sli data cap: %#[2]x\n", slCap, *slCap)

	fmt.Printf("\n\n")

	// sli.append undefined (type string has no field or method append)
	/*
	sli = sli.append("This is another line.")
	aptr := (* int64)(unsafe.Pointer(&sli))
	fmt.Printf("aptr: %p, sli data struct address: %p\n", aptr, &sli)
	fmt.Printf("sli data struct address: %p, sli[0] = %c\n", &sli, sli[0])
	fmt.Printf("sli data address: 0x%x\n", *aptr)
	fmt.Printf("sli data address: %#x\n", *aptr)

	aslLen := (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(aptr)) + uintptr(8)))
	fmt.Printf("sli data len address: %p, sli data len: %v\n", aslLen, *aslLen)

	aslCap := (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(ptr)) + uintptr(16)))
	fmt.Printf("sli data cap address: %p, sli data cap: %#[2]v, sli data cap: %#[2]x\n", aslCap, *aslCap)
	*/

	for i := 0; i < len(sli); i++ {
		// p := (* byte)(unsafe.Pointer(uintptr(*ptr) + uintptr(i) * unsafe.Sizeof(uint8(0))))
		p := (* byte)(unsafe.Pointer(uintptr(*ptr) + uintptr(i * 1)))
		// fmt.Printf("address: %p, value: %c \\", p, *p)
		fmt.Printf("%c", *p)
	}

	fmt.Printf("\n\n")

	// 但是整型类型却可以获取数组或者slice中元素的地址
	sl := []byte{1,2,3,4,5}
	pr := (* int64)(unsafe.Pointer(&sl))
	fmt.Printf("sl data struct address: %p, sl data address: %#x\n", pr, *pr)
	fmt.Printf("sl data struct address: %p, sl data address: %p, &sl[0]: %p, &sl[1]: %p\n\n", pr, sl, &sl[0], &sl[1])

	sLen := (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(pr)) + uintptr(8)))
	fmt.Printf("sl data len address: %p, slice data len: %v\n", sLen, *sLen)

	sCap := (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(pr)) + uintptr(16)))
	fmt.Printf("sl data cap address: %p, slice data cap: %v\n", sCap, *sCap)

	for i := 0; i < 32; i++ {
		pLen := (* byte)(unsafe.Pointer(uintptr(unsafe.Pointer(pr)) + uintptr(i * 1)))
		fmt.Printf("%p , %#x\n", pLen, *pLen)
	}

	for i := 0; i < len(sl); i++ {
		new_pr := (* uint8)(unsafe.Pointer(uintptr(*pr) + uintptr(i * 1)))
		fmt.Printf("sl[%v] = %v\n", i, *new_pr)
	}

	fmt.Printf("unsafe.Sizeof(0) value: %[1]T, unsafe.Sizeof(0) value: %[1]v\n", unsafe.Sizeof(0))
	fmt.Printf("unsafe.Sizeof(byte(0)) value: %[1]T, unsafe.Sizeof(byte(0)) value: %[1]v\n", unsafe.Sizeof(byte(0)))
	fmt.Printf("unsafe.Sizeof(uint8(0)) value: %[1]T, unsafe.Sizeof(uint8(0)) value: %[1]v\n", unsafe.Sizeof(uint8(0)))
	fmt.Printf("unsafe.Sizeof(uint16(0)) value: %[1]T, unsafe.Sizeof(uint16(0)) value: %[1]v\n", unsafe.Sizeof(uint16(0)))
	fmt.Printf("unsafe.Sizeof(uint32(0)) value: %[1]T, unsafe.Sizeof(uint32(0)) value: %[1]v\n", unsafe.Sizeof(uint32(0)))
	fmt.Printf("unsafe.Sizeof(uint64(0)) value: %[1]T, unsafe.Sizeof(uint64(0)) value: %[1]v\n", unsafe.Sizeof(uint64(0)))


	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
