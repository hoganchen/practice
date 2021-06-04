/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"reflect"
	"time"
	"unsafe"
)

type SliceHeader struct {
	Data uintptr
	Len  int
	Cap  int
}

func memPrint(ptr *uint, len uint) {
	new_ptr := (*uint)(unsafe.Pointer(ptr))
	fmt.Printf("%p ", new_ptr)

	for i := uint(1); i < len; i++ {
		// fmt.Printf("%p ", new_ptr)
		fmt.Printf("%08x ", *new_ptr)
		new_ptr = (*uint)(unsafe.Pointer(uintptr(unsafe.Pointer(ptr)) + uintptr(4*i)))

		if 0 == i%4 {
			fmt.Printf("\n")
			fmt.Printf("%p ", new_ptr)
		}
	}
	fmt.Printf("\n\n")
}

func stringArrayAndSlice() {
	intArray := [10]int{1, 2, 3, 5: 9}
	intSlice := intArray[:]
	fmt.Printf("unsafe.Sizeof(intArray[0]): %v\n", unsafe.Sizeof(intArray[0]))
	fmt.Printf("reflect.Typeof(intArray[0]): %v\n", reflect.TypeOf(intArray[0]))
	fmt.Printf("reflect.Typeof(intArray[0]).Size(): %v\n", reflect.TypeOf(intArray[0]).Size())

	// 根据如下打印得知，在golang中，数组的地址即为数组第一个元素的首地址
	for i := 0; i < len(intArray); i++ {
		fmt.Printf("&intAarray[%v] = %p, intArray[%v] = %v\n", i, &intArray[i], i, intArray[i])
	}

	memPrint((*uint)(unsafe.Pointer(&intArray)), 32)
	memPrint((*uint)(unsafe.Pointer(&intSlice)), 32)

	// 根据如下打印，slice引入一个抽象层，即用SliceHeader结构体用于描述该切片，实际上切片也是指向底层数组
	// %p &intSlice获得的是SliceHeader结构体的地址，而%p intSlice则获得底层数组的地址
	sliceAddr := &intSlice
	fmt.Printf("intArray address: %p\n", &intArray)
	fmt.Printf("intSlice address: %p\n", &intSlice)
	fmt.Printf("intSlice array address: %p\n", intSlice)

	// 从SliceHeader的数据结构可得出，第一个成员指向底层数组的地址，第二个成员是切片的长度，第三个成员是切片的容量
	// 未发生扩容时，对切片的修改直接影响原始数组
	sliceStruct := (*SliceHeader)(unsafe.Pointer(sliceAddr))
	fmt.Printf("sliceStruct.Data address: %p, sliceStruct.Data: 0x%08x\n", &sliceStruct.Data, sliceStruct.Data)
	fmt.Printf("sliceStruct.Len address: %p, sliceStruct.Len: 0x%08x\n", &sliceStruct.Len, sliceStruct.Len)
	fmt.Printf("sliceStruct.Cap address: %p, sliceStruct.Cap: 0x%08x\n", &sliceStruct.Cap, sliceStruct.Cap)
	memPrint((*uint)(unsafe.Pointer(sliceStruct.Data)), 32)

	// 当发生扩容时，会重新初始化底层数组，即为底层数组重新分配内存并拷贝，并把切片的结构体第一个成员指向新的数组地址，
	// 同时更新切片结构体中Len和Cap的值
	intSlice = append(intSlice, 10, 11, 12, 13, 14, 15)
	memPrint((*uint)(unsafe.Pointer(&intArray)), 32)
	memPrint((*uint)(unsafe.Pointer(&intSlice)), 32)

	fmt.Printf("sliceStruct.Data address: %p, sliceStruct.Data: 0x%08x\n", &sliceStruct.Data, sliceStruct.Data)
	fmt.Printf("sliceStruct.Len address: %p, sliceStruct.Len: 0x%08x\n", &sliceStruct.Len, sliceStruct.Len)
	fmt.Printf("sliceStruct.Cap address: %p, sliceStruct.Cap: 0x%08x\n", &sliceStruct.Cap, sliceStruct.Cap)
	memPrint((*uint)(unsafe.Pointer(sliceStruct.Data)), 32)

}

/*
可参考下列文章
Go 切片：用法和本质(https://blog.go-zh.org/go-slices-usage-and-internals)
Go 语言设计与实现--3.2 切片(https://draveness.me/golang/docs/part2-foundation/ch03-datastructure/golang-array-and-slice/)
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	stringArrayAndSlice()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
