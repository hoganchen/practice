/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
@Description:   golang程序模板
*/

/*
go mod管理包
mkdir trade
cd trade
go mod init trade

go mod下载缺失的库
go mod tidy
*/
package main

import (
	"flag"
	"fmt"
	"reflect"
	"time"
	"unsafe"
)

// uint8是一个字节，uint32是4个字节, 在64位操作系统中，uint, int, uint64, int64都是8个字节
func memPrint(ptr *uint32, len uint) {
	newPtr := (*uint32)(unsafe.Pointer(ptr))
	fmt.Printf("%p ", newPtr)

	for i := uint(1); i <= len; i++ {
		// fmt.Printf("%p ", new_ptr)
		fmt.Printf("%08x ", *newPtr)
		newPtr = (*uint32)(unsafe.Pointer(uintptr(unsafe.Pointer(ptr)) + uintptr(4*i)))

		if i%4 == 0 {
			fmt.Printf("\n")
			fmt.Printf("%p ", newPtr)
		}
	}
	fmt.Printf("\n\n")
}

func debugFunc() {
}

/*
https://zhuanlan.zhihu.com/p/400886653
https://zhuanlan.zhihu.com/p/401588910c

第一个是对语言类型转换规则的扩展，允许从切片到数组指针的转换
Go通过运行时对这类切片到数组指针的转换代码做检查，如果发现越界行为，就会通过运行时panic予以处理。Go运行时实施检查的一条原则就是“转换后的数组长度不能大于原切片的长度”，注意这里是切片的长度(len)，而不是切片的容量(cap)。

第二个变动则是unsafe包增加了两个函数：Add与Slice。使用这两个函数可以让开发人员更容易地写出符合unsafe包使用的安全规则的代码。这两个函数原型如下：

// $GOROOT/src/unsafe.go
func Add(ptr Pointer, len IntegerType) Pointe
func Slice(ptr *ArbitraryType, len IntegerType) []ArbitraryType

unsafe.Add允许更安全的指针运算，而unsafe.Slice允许更安全地将底层存储的指针转换为切片。
*/
func mainFunc() {
	s1 := []int{1, 2, 3}
	fmt.Printf("s1 address: %p\n", &s1)
	fmt.Printf("sliceHeader: %x\n", (*reflect.SliceHeader)(unsafe.Pointer(&s1)))
	fmt.Print("unsafe.Pointer(&s1):\n")
	memPrint((*uint32)(unsafe.Pointer(&s1)), 8)

	s1Addr := unsafe.Pointer(&s1)
	fmt.Printf("s1Addr:\n")
	memPrint((*uint32)(s1Addr), 8)

	var s1ArrayAddr, s1LenAddr, s1CapAddr unsafe.Pointer
	// 本质上unsafe.Add(ptr, len) 就等价于unsafe.Pointer(uintptr(ptr) + uintptr(len))
	s1ArrayAddr = unsafe.Add(unsafe.Pointer(&s1), uintptr(0))
	s1LenAddr = unsafe.Add(unsafe.Pointer(&s1), uintptr(8))
	s1CapAddr = unsafe.Add(unsafe.Pointer(&s1), uintptr(16))
	// 打印SliceHeader各元素的地址
	fmt.Printf("s1ArrayAddr: %p, s1LenAddr: %p, s1CapAddr: %p\n", s1ArrayAddr, s1LenAddr, s1CapAddr)

	// 以下几行语句与上述几条语句相同，只是上述几条语句用了unsafe.Add函数而已
	s1ArrayAddr = unsafe.Pointer(uintptr(unsafe.Pointer(&s1)) + uintptr(0))
	s1LenAddr = unsafe.Pointer(uintptr(unsafe.Pointer(&s1)) + uintptr(8))
	s1CapAddr = unsafe.Pointer(uintptr(unsafe.Pointer(&s1)) + uintptr(16))
	// 打印SliceHeader各元素的地址
	fmt.Printf("s1ArrayAddr: %p, s1LenAddr: %p, s1CapAddr: %p\n", s1ArrayAddr, s1LenAddr, s1CapAddr)

	s1Array := *(*int)(unsafe.Pointer(s1ArrayAddr))
	s1Len := *(*int)(unsafe.Pointer(s1LenAddr))
	s1Cap := *(*int)(unsafe.Pointer(s1CapAddr))
	// 打印sliceHeader的值
	fmt.Printf("s1Array address: 0x%x, s1Len: %v, s1Cap: %v\n", s1Array, s1Len, s1Cap)
	// 打印底层数组的数据
	fmt.Printf("s1Array:\n")
	memPrint((*uint32)(unsafe.Pointer(uintptr(s1Array))), 8)

	// 第一个是对语言类型转换规则的扩展，允许从切片到数组指针的转换，下面的代码在Go 1.17版本中是可以正常编译和运行的
	var a = [5]int{11, 12, 13, 14, 15}
	slice1 := a[:]
	// slice2 := unsafe.Slice(&a[0], 5)
	slice2 := unsafe.Slice(&a[0], 5) //unsafe.Slice的第一个参数为数组第一个元素的地址
	fmt.Printf("a: %v, slice1: %v, slice2: %v\n", a, slice1, slice2)

	// 由于未发生扩容，slice1和slice2的底层数组都是a，所以修改slice2[2]的值，a、slice1和slice2的打印结果都是相同的
	slice2[2] = slice2[2] + 10
	fmt.Printf("a: %v, slice1: %v, slice2: %v\n", a, slice1, slice2)

	/*
		Go 1.17直接支持将切片转换为数组指针，我们可以在Go 1.17中编写和运行如下面这样的代码
		Slice 的数据结构定义如下:
		type SliceHeader struct {
			Data uintptr
			Len  int
			Cap  int
		}
	*/
	var b = []int{11, 12, 13}
	var p = (*[3]int)(b)
	p[1] = p[1] + 10
	// 从如下打印即可看出，*(*int)(unsafe.Pointer(&b))与p都指向同一个地址，即slice b的底层数组地址
	fmt.Printf("b: %v, data address: 0x%x, p: %p, p: %v\n", b, *(*uintptr)(unsafe.Pointer(&b)), p, *p) // [11 22 13]
}

// go run goTemplate.go --debug=true > debug.log 2>&1
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	debugFlag := flag.Bool("debug", false, "The debug flag")
	flag.Parse()

	if !*debugFlag {
		mainFunc()
	} else {
		debugFunc()
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
