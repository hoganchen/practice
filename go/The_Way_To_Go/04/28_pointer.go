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

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	s := "good bye"
	var p *string = &s
	old_ps := (* int64)(unsafe.Pointer((&s)))
	fmt.Printf("s data struct address: %p, old_ps: %p, p: %p\n", &s, old_ps, p)
	fmt.Printf("s data address: %p\n", (* int)(unsafe.Pointer(uintptr(*old_ps))))

	old_sLen := (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(old_ps)) + uintptr(8)))
	fmt.Printf("s data len address: %p, s data len: %v\n", old_sLen, *old_sLen)

	old_p_data, old_data_len := *old_ps, *old_sLen

	*p = "welcome to golang world"
	new_ps := (* int64)(unsafe.Pointer((&s)))
	fmt.Printf("s data struct address: %p, new_ps: %p, p: %p\n", &s, new_ps, p)
	fmt.Printf("s data address: %p\n", (* int)(unsafe.Pointer(uintptr(*new_ps))))

	new_sLen := (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(new_ps)) + uintptr(8)))
	fmt.Printf("s data len address: %p, s data len: %v\n", new_sLen, *new_sLen)

	fmt.Printf("old_p_data: %#x, old_data_len: %v\n", old_p_data, old_data_len)

	for i := 0; i < old_data_len; i++ {
		pc := (* byte)(unsafe.Pointer(uintptr(old_p_data) + uintptr(i) * unsafe.Sizeof(byte(0))))
		fmt.Printf("%c", *pc)
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
