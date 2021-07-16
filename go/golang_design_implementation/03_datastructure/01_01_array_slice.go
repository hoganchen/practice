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

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	/*
	Go语言中的数组有两种不同的创建方式, 一种是显式的指定数组的大小, 另一种是使用 [...]T 声明数组,
	Go语言会在编译期间通过源代码对数组的大小进行推断:
	1. arr1 := [3]int{1, 2, 3}
	2. arr2 := [...]int{1, 2, 3}

	上述两种声明方式在运行期间得到的结果是完全相同的,后一种声明方式在编译期间就会被『转换』成为前一种,
	这也就是编译器对数组大小的推导,下面我们来介绍编译器的推导过程。

	在 Go 语言中, 切片类型的声明方式与数组有一些相似, 由于切片的长度是动态的, 所以声明时只需要指定切片中的元素类型:
	1. []int
	2. []interface{}
	从切片的定义我们能推测出, 切片在编译期间的生成的类型只会包含切片中的元素类型,即 int 或者 interface{} 等。
	*/
	arr := [...]int{1, 2, 3, 4, 5}
	sl := arr[:]
	fmt.Printf("&arr = %p, &arr[0] = %p\n", &arr, &arr[0])  // &arr表示数组的地址，&arr[0]是数组第一个元素的地址，两者应该是同一个地址
	fmt.Printf("&sl = %p, sl = %p, &sl[0] = %p\n", &sl, sl, &sl[0])  // &sl是切片数据结构的地址，sl是切片底层数组的地址，&sl[0]是切片底层数组第一个元素的地址

	memPrint((*uint32)(unsafe.Pointer(&arr)), 32)
	memPrint((*uint32)(unsafe.Pointer(&sl)), 32)

	/*
	编译期间的切片是Slice类型的, 但是在运行时切片由如下的SliceHeader结构体表示, 其中Data字段是指向数组的指针,
	Len表示当前切片的长度, 而Cap表示当前切片的容量, 也就是Data数组的大小:
	type SliceHeader struct {
		Data uintptr
		Len int
		Cap int
	}
	Data作为一个指针指向的数组是一片连续的内存空间,这片内存空间可以用于存储切片中保存的全部元素,数组中的元素只是逻辑上的概念,
	底层存储其实都是连续的,所以我们可以将切片理解成一片连续的内存空间加上长度与容量的标识。
	*/
	sl_arr_addr := unsafe.Pointer(uintptr(*(* int)(unsafe.Pointer(&sl))))  // 切片SliceHeader数据结构，data的地址
	sl_len := *(* int)(unsafe.Pointer(uintptr(unsafe.Pointer(&sl)) + uintptr(8)))  // 切片SliceHeader数据结构，切片的长度
	sl_cap := *(* int)(unsafe.Pointer(uintptr(unsafe.Pointer(&sl)) + uintptr(16)))  // 切片SliceHeader数据结构，切片的容量
	fmt.Printf("sl_arr_addr = %p, sl_len = %v, sl_cap = %v\n", sl_arr_addr, sl_len, sl_cap)
	memPrint((*uint32)(sl_arr_addr), 32)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
