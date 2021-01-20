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

	s := "hel" + "lo,"
	ps := (* int64)(unsafe.Pointer((&s)))
	fmt.Printf("s data struct address: %p, ps: %p\n", &s, ps)
	fmt.Printf("s data address: %p\n", (* int)(unsafe.Pointer(uintptr(*ps))))

	sLen := (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(ps)) + uintptr(8)))
	fmt.Printf("s data len address: %p, s data len: %v\n", sLen, *sLen)

	fmt.Printf("s value:\n")
	for i := 0; i < len(s); i++ {
		// pc := (* byte)(unsafe.Pointer(uintptr(*ps) + uintptr(i * 1)))
		pc := (* byte)(unsafe.Pointer(uintptr(*ps) + uintptr(i) * unsafe.Sizeof(byte(0))))
		// fmt.Printf("s[%[1]v] address: %[2]p, s[%[1]v] value: %[3]c\n", i, pc, *pc)
		fmt.Printf("%c", *pc)
	}

	fmt.Printf("\n\n")

	s += " world"
	fmt.Printf("s type: %T\n", s)
	ps = (* int64)(unsafe.Pointer((&s)))
	fmt.Printf("s data struct address: %p, ps: %p\n", &s, ps)
	fmt.Printf("s data address: %p\n", (* int)(unsafe.Pointer(uintptr(*ps))))

	sLen = (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(ps)) + uintptr(8)))
	fmt.Printf("s data len address: %p, s data len: %v\n", sLen, *sLen)

	fmt.Printf("s value:\n")
	for i := 0; i < len(s); i++ {
		// pc := (* byte)(unsafe.Pointer(uintptr(*ps) + uintptr(i * 1)))
		pc := (* byte)(unsafe.Pointer(uintptr(*ps) + uintptr(i) * unsafe.Sizeof(byte(0))))
		// fmt.Printf("s[%[1]v] address: %[2]p, s[%[1]v] value: %[3]c\n", i, pc, *pc)
		fmt.Printf("%c", *pc)
	}

	fmt.Printf("\n\n")

	/*
	string转slice
	https://nanxiao.me/golang-string-byte-slice-conversion/
	https://cloud.tencent.com/developer/article/1444356
	*/
	sl := []byte(s)
	fmt.Printf("sl type: %T\n", sl)
	// sl = append(sl, ", hello from hogan.")
	psl := (* int64)(unsafe.Pointer((&sl)))
	fmt.Printf("sl data struct address: %p, psl: %p\n", &sl, psl)
	fmt.Printf("sl data address: %p\n", (* int)(unsafe.Pointer(uintptr(*psl))))

	slLen := (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(psl)) + uintptr(8)))
	fmt.Printf("sl data len address: %p, sl data len: %v\n", slLen, *slLen)

	slCap := (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(psl)) + uintptr(16)))
	fmt.Printf("sl data cap address: %p, sl data cap: %v\n", slCap, *slCap)

	fmt.Printf("sl value:\n")
	for i := 0; i < len(sl); i++ {
		// pc := (* byte)(unsafe.Pointer(uintptr(*psl) + uintptr(i * 1)))
		pc := (* byte)(unsafe.Pointer(uintptr(*psl) + uintptr(i) * unsafe.Sizeof(byte(0))))
		// fmt.Printf("s[%[1]v] address: %[2]p, s[%[1]v] value: %[3]c\n", i, pc, *pc)
		fmt.Printf("%c", *pc)
	}

	fmt.Printf("\n\n")

	sl = append(sl, ',', ' ', 'h', 'e', 'l', 'l', 'o', ' ', 'f', 'r', 'o', 'm', ' ', 'h', 'o', 'g', 'a', 'n', '.')
	psl = (* int64)(unsafe.Pointer((&sl)))
	fmt.Printf("sl data struct address: %p, psl: %p\n", &sl, psl)
	fmt.Printf("sl data address: %p\n", (* int)(unsafe.Pointer(uintptr(*psl))))

	slLen = (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(psl)) + uintptr(8)))
	fmt.Printf("sl data len address: %p, sl data len: %v\n", slLen, *slLen)

	slCap = (* int)(unsafe.Pointer(uintptr(unsafe.Pointer(psl)) + uintptr(16)))
	fmt.Printf("sl data cap address: %p, sl data cap: %v\n", slCap, *slCap)

	fmt.Printf("sl value:\n")
	for i := 0; i < len(sl); i++ {
		// pc := (* byte)(unsafe.Pointer(uintptr(*psl) + uintptr(i * 1)))
		pc := (* byte)(unsafe.Pointer(uintptr(*psl) + uintptr(i) * unsafe.Sizeof(byte(0))))
		// fmt.Printf("s[%[1]v] address: %[2]p, s[%[1]v] value: %[3]c\n", i, pc, *pc)
		fmt.Printf("%c", *pc)
	}

	fmt.Printf("\n\n")

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
