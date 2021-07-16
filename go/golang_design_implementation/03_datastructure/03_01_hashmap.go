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
golang将某个值转换为指针
x := 0xc00007ca90
ptr := unsafe.Pointer(uintptr(x))

golang获取某个指针所指向的值
ptr := unsafe.Pointer(uintptr(x))
val := *(* uint)ptr
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	/*
	Go 语言运行时同时使用了多个数据结构组合表示哈希表,其中使用 hmap 结构体来表示哈希,我们先来看一下这个结构体内部的字段:
	type hmap struct {
		count int
		flags uint8
		B uint8
		noverflow uint16
		hash0 uint32

		buckets unsafe.Pointer
		oldbuckets unsafe.Pointer
		nevacuate uintptr

		extra *mapextra
	}
	count 表示当前哈希表中的元素数量;
	B 表示当前哈希表持有的 buckets 数量,但是因为哈希表中桶的数量都 2 的倍数,所以该字段会存储对数,也就是 len(buckets) == 2^B ;
	hash0 是哈希的种子,它能为哈希函数的结果引入随机性,这个值在创建哈希表时确定,并在调用哈希函数时作为参数传入;
	oldbuckets 是哈希在扩容时用于保存之前 buckets 的字段,它的大小是当前 buckets 的一半;
	*/
	mi := map[string]int{"a":1, "b":2, "c":3}
	fmt.Printf("mi = %p\n", mi)
	ptr := unsafe.Pointer(uintptr(*(*uint)(unsafe.Pointer(&mi))))  // hmap结构体的地址
	val := *(*uint)(unsafe.Pointer(uintptr(*(*uint)(unsafe.Pointer(&mi)))))  // hmap结构体中，哈希表元素的数量
	fmt.Printf("ptr: %p\n", ptr)
	memPrint((*uint32)(ptr), 32)
	fmt.Printf("val: %v\n", val)

	buckets_val := *(*uint)(unsafe.Pointer(uintptr(*(*uint)(unsafe.Pointer(&mi))) + uintptr(16)))
	buckets_ptr := unsafe.Pointer(uintptr(buckets_val))  // hmap结构体中，buckets的地址
	fmt.Printf("buckets_ptr: %#v\n", buckets_val)
	memPrint((*uint32)(buckets_ptr), 32)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
