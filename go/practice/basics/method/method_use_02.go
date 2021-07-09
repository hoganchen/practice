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

type Values map[string][]string

func (v Values)Get(key string) string {
	if vs := v[key]; len(vs) > 0 {
		return vs[0]
	}

	return ""
}

func (v Values)Add(key, value string) {
	v[key] = append(v[key], value)
}

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

	m := Values{"lang": {"en", "zh"}}  // direct construction
	fmt.Printf("&m = %p\n", &m)
	fmt.Printf("m = %p\n", m)
	memPrint((*uint32)(unsafe.Pointer(&m)), 32)

	mi := map[string]int{"a":1, "b":2, "c":3}
	fmt.Printf("mi = %p\n", mi)
	ptr := unsafe.Pointer(uintptr(*(*uint)(unsafe.Pointer(&mi))))
	val := *(*uint)(unsafe.Pointer(uintptr(*(*uint)(unsafe.Pointer(&mi)))))
	fmt.Printf("ptr: %p\n", ptr)
	memPrint((*uint32)(ptr), 32)
	fmt.Printf("val: %v\n", val)
	buckets_val := *(*uint)(unsafe.Pointer(uintptr(*(*uint)(unsafe.Pointer(&mi))) + uintptr(16)))
	buckets_ptr := unsafe.Pointer(uintptr(buckets_val))
	fmt.Printf("buckets_ptr: %#v\n", buckets_val)
	memPrint((*uint32)(buckets_ptr), 32)

	m.Add("item", "1")
	m.Add("item", "2")
	fmt.Println(m.Get("lang"))  // "en"
	fmt.Println(m.Get("q"))  // ""
	fmt.Println(m.Get("item"))  // "1" (first value)
	fmt.Println(m["item"])  // "[1 2]" (direct map access)
	fmt.Println(m["lang"])  // "[1 2]" (direct map access)
	m = nil
	fmt.Printf("&m = %p\n", &m)
	memPrint((*uint32)(unsafe.Pointer(&m)), 32)
	fmt.Println(m.Get("item")) // ""
	// m.Add("item", "3")  // panic: assignment to entry in nil map

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
