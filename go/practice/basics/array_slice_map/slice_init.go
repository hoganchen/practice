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
func memPrintUint(ptr *uint, len uint) {
	new_ptr := (*uint)(unsafe.Pointer(ptr))
	fmt.Printf("%p ", new_ptr)

	for i := uint(1); i <= len / uint(unsafe.Sizeof(uint(0))); i++ {
		// fmt.Printf("%p ", new_ptr)
		fmt.Printf("%016x ", *new_ptr)
		new_ptr = (*uint)(unsafe.Pointer(uintptr(unsafe.Pointer(ptr)) + uintptr(8*i)))

		if 0 == i%2 {
			fmt.Printf("\n")
			fmt.Printf("%p ", new_ptr)
		}
	}
	fmt.Printf("\n\n")
}

// uint8是一个字节，uint32是4个字节, 在64位操作系统中，uint, int, uint64, int64都是8个字节
func memPrintUint64(ptr *uint64, len uint) {
	new_ptr := (*uint64)(unsafe.Pointer(ptr))
	fmt.Printf("%p ", new_ptr)

	for i := uint(1); i <= len / uint(unsafe.Sizeof(uint64(0))); i++ {
		// fmt.Printf("%p ", new_ptr)
		fmt.Printf("%016x ", *new_ptr)
		new_ptr = (*uint64)(unsafe.Pointer(uintptr(unsafe.Pointer(ptr)) + uintptr(8*i)))

		if 0 == i%2 {
			fmt.Printf("\n")
			fmt.Printf("%p ", new_ptr)
		}
	}
	fmt.Printf("\n\n")
}

// uint8是一个字节，uint32是4个字节, 在64位操作系统中，uint, int, uint64, int64都是8个字节
func memPrintUint32(ptr *uint32, len uint) {
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

// uint8是一个字节，uint32是4个字节, 在64位操作系统中，uint, int, uint64, int64都是8个字节
func memPrintUint8(ptr *uint8, len uint) {
	new_ptr := (*uint32)(unsafe.Pointer(ptr))
	fmt.Printf("%p ", new_ptr)

	for i := uint(1); i <= len; i++ {
		// fmt.Printf("%p ", new_ptr)
		new_ptr_01 := (*uint8)(unsafe.Pointer(uintptr(unsafe.Pointer(new_ptr)) + uintptr(0)))
		new_ptr_02 := (*uint8)(unsafe.Pointer(uintptr(unsafe.Pointer(new_ptr)) + uintptr(1)))
		new_ptr_03 := (*uint8)(unsafe.Pointer(uintptr(unsafe.Pointer(new_ptr)) + uintptr(2)))
		new_ptr_04 := (*uint8)(unsafe.Pointer(uintptr(unsafe.Pointer(new_ptr)) + uintptr(3)))

		fmt.Printf("%02x%02x%02x%02x ", *new_ptr_01, *new_ptr_02, *new_ptr_03, *new_ptr_04)
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

	var s []int
	fmt.Printf("s struct address: %p, s point address: %p, s value: %v, cap(s): %v, len(s): %v\n", &s, s, s, len(s), cap(s))
	memPrintUint32((*uint32)(unsafe.Pointer(&s)), 16)
	memPrintUint8((*uint8)(unsafe.Pointer(&s)), 16)

	// fmt.Printf("s[]0 point address: %p, s[0] value: %v\n", &s[0], s[0])
	// memPrintUint32((*uint)(unsafe.Pointer(&s[0])), 16)

	s = append(s, 1)
	fmt.Printf("s struct address: %p, s point address: %p, s value: %v, cap(s): %v, len(s): %v\n", &s, s, s, len(s), cap(s))
	memPrintUint32((*uint32)(unsafe.Pointer(&s)), 16)
	memPrintUint8((*uint8)(unsafe.Pointer(&s)), 16)
	memPrintUint64((*uint64)(unsafe.Pointer(&s)), 128)
	memPrintUint((*uint)(unsafe.Pointer(&s)), 128)

	ss := make([]int, 0)
	fmt.Printf("ss point address: %p, ss point address: %p, ss value: %v, cap(ss): %v, len(ss): %v\n", &ss, ss, ss, len(ss), cap(ss))
	memPrintUint32((*uint32)(unsafe.Pointer(&ss)), 16)

	ss = append(ss, 1)
	fmt.Printf("ss point address: %p, ss point address: %p, ss value: %v, cap(ss): %v, len(ss): %v\n", &ss, ss, ss, len(ss), cap(ss))
	memPrintUint32((*uint32)(unsafe.Pointer(&ss)), 16)
	memPrintUint8((*uint8)(unsafe.Pointer(&ss)), 16)

	fmt.Printf("ss[0] point address: %p, ss[0] value: %v\n", &ss[0], ss[0])
	memPrintUint32((*uint32)(unsafe.Pointer(&ss[0])), 16)
	memPrintUint8((*uint8)(unsafe.Pointer(&ss[0])), 16)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
