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

// uint8是一个字节，uint32是4个字节, 在64位操作系统中，uint, int, uint64, int64都是8个字节
func memPrint(ptr *uint32, len uint) {
	new_ptr := (*uint32)(unsafe.Pointer(ptr))
	fmt.Printf("%p ", new_ptr)

	for i := uint(1); i <= len; i++ {
		// fmt.Printf("%p ", new_ptr)
		fmt.Printf("%08x ", *new_ptr)
		new_ptr = (*uint32)(unsafe.Pointer(uintptr(unsafe.Pointer(ptr)) + uintptr(4*i)))

		if 0 == i%4 {
			fmt.Printf("\n")
			fmt.Printf("%p ", new_ptr)
		}
	}
	fmt.Printf("\n\n")
}

/*

字符串虽然在 Go 语言中是基本类型 string , 但是它实际上是由字符组成的数组, C 语言中的字符串就使用字符数组 char[] 表示,
作为数组会占用一片连续的内存空间, 这片内存空间存储了的字节共同组成了字符串, Go 语言中的字符串其实是一个只读的字节数组

如果是代码中存在的字符串,会在编译期间被标记成只读数据 SRODATA 符号, 假设我们有以下的一段代码, 其中包含了一个字符串,
当我们将这段代码编译成汇编语言时, 就能够看到 hello 字符串有一个 SRODATA 的标记


当我们使用 Go 语言解析和序列化 JSON 等数据格式时, 经常需要将数据在 string 和 []byte 之间来回转换,
类型转换的开销并没有想象的那么小, 我们经常会看到 runtime.slicebytetostring 等函数出现在火焰图中, 成为程序的性能热点。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	/*
	字符串在 Go 语言中的接口其实非常简单, 每一个字符串在运行时都会使用如下的 StringHeader 结构体表示,
	在运行时包的内部其实有一个私有的结构 stringHeader , 它有着完全相同的结构只是用于存储数据的 Data 字段使用了 unsafe.Pointer 类型:
	type StringHeader struct {
		Data uintptr
		Len int
	}
	我们会经常会说字符串是一个只读的切片类型,这是因为切片在 Go 语言的运行时表示与字符串高度相似
	*/
	str := "hello from go"
	fmt.Printf("&str = %p\n", &str)
	memPrint((*uint32)(unsafe.Pointer(&str)), 32)

	ptr := unsafe.Pointer(uintptr(*(*uint)(unsafe.Pointer(&str))))  // StringHeader结构体中，字符串的地址
	val := *(* int)(unsafe.Pointer(uintptr(unsafe.Pointer(&str)) + uintptr(8)))  // StringHeader结构体中，字符串的长度
	fmt.Printf("val: %v\n", val)
	fmt.Printf("ptr: %p\n", ptr)
	memPrint((*uint32)(ptr), 32)  //字符串的值，在堆上分配

	for _, bt := range(str) {
		fmt.Printf("%02x ", bt)
	}
	fmt.Println("\n")

	/*
	只读只意味着字符串会分配到只读的内存空间并且这块内存不会被修改, 但是在运行时我们其实还是可以将这段内存拷贝到堆或者栈上,
	将变量的类型转换成 []byte 之后就可以进行,修改后通过类型转换就可以变回 string ,
	Go 语言只是不支持直接修改 string 类型变量的内存空间。
	*/
	// sl_str := []byte(str[:])
	sl_str := []byte(str)
	sl_arr_addr := unsafe.Pointer(uintptr(*(* int)(unsafe.Pointer(&sl_str))))  // 切片SliceHeader数据结构，data的地址
	sl_len := *(* int)(unsafe.Pointer(uintptr(unsafe.Pointer(&sl_str)) + uintptr(8)))  // 切片SliceHeader数据结构，切片的长度
	sl_cap := *(* int)(unsafe.Pointer(uintptr(unsafe.Pointer(&sl_str)) + uintptr(16)))  // 切片SliceHeader数据结构，切片的容量

	fmt.Printf("&sl_str = %p, sl_str = %p, &sl_str[0] = %p\n", &sl_str, sl_str, &sl_str[0])  // &sl_str是切片数据结构的地址，sl_str是切片底层数组的地址，&sl_str[0]是切片底层数组第一个元素的地址
	fmt.Printf("sl_arr_addr = %p, sl_len = %v, sl_cap = %v\n", sl_arr_addr, sl_len, sl_cap)

	memPrint((*uint32)(unsafe.Pointer(&sl_str)), 32)
	memPrint((*uint32)(sl_arr_addr), 32)

	sl_str[0] = 'H'
	sl_str[len(sl_str) - 2] = 'G'
	sl_string := string(sl_str)
	fmt.Printf("sl_string: %v\n", sl_string)

	strconcat := "hello " + "from " + "go"
	fmt.Printf("strconcat: %v\n", strconcat)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
