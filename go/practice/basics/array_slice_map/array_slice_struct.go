/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"unsafe"
	"reflect"
)

func memPrint(ptr *uint, len uint) {
	fmt.Printf("%p ", ptr)
    for i := uint(0); i < len; i++ {
        new_ptr := (* uint)(unsafe.Pointer(uintptr(unsafe.Pointer(ptr)) + uintptr(4 * i)))
		// fmt.Printf("%p ", new_ptr)
        fmt.Printf("%08x ", *new_ptr)

        if(3 == i % 4) {
            fmt.Printf("\n")
            fmt.Printf("%p ", new_ptr);
        }
    }
    fmt.Printf("\n\n")
}

func stringArrayAndSlice() {
	intArray := [10]int{1, 2, 3, 5:9}
	fmt.Printf("unsafe.Sizeof(intArray[0]): %v\n", unsafe.Sizeof(intArray[0]))
	fmt.Printf("reflect.Typeof(intArray[0]): %v\n", reflect.TypeOf(intArray[0]))
	fmt.Printf("reflect.Typeof(intArray[0]).Size(): %v\n", reflect.TypeOf(intArray[0]).Size())

	memPrint((* uint)(unsafe.Pointer(&intArray)), 32)

}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	stringArrayAndSlice()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
