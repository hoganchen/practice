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

func slice_operation(op_len int, s []int) {
	for i := 0; i < op_len; i++ {
		fmt.Printf("Before: s address: %p, s address: %p, s: %v, len(s): %v, cap(s): %v\n", &s, s, s, len(s), cap(s))

		if i < len(s) {
			s[i] = op_len - i - 1
		} else {
			s = append(s, op_len - i - 1)
		}

		fmt.Printf("After: s address: %p, s address: %p, s: %v, len(s): %v, cap(s): %v\n", &s, s, s, len(s), cap(s))
	}
}

func slice_operation_ptr(op_len int, s *[]int) {
	for i := 0; i < op_len; i++ {
		fmt.Printf("Before: s address: %p, s address: %p, s: %v, len(s): %v, cap(s): %v\n", s, *s, *s, len(*s), cap(*s))

		if i < len(*s) {
			(*s)[i] = op_len - i - 1
		} else {
			*s = append(*s, op_len - i - 1)
		}

		fmt.Printf("After: s address: %p, s address: %p, s: %v, len(s): %v, cap(s): %v\n", s, *s, *s, len(*s), cap(*s))
	}
}

func slice_test_01() {
	fmt.Printf("\n############################## slice_test_01 ##############################\n")

	s := make([]int, 10, 100)

	fmt.Printf("s address: %p, s address: %p, s: %v, len(s): %v, cap(s): %v\n", &s, s, s, len(s), cap(s))

	for i := 0; i < len(s); i++ {
		s[i] = i
	}

	for i := 0; i < len(s); i++ {
		fmt.Printf("&s[%v] = %p, s[%v] = %v\n", i, &s[i], i, s[i])
	}

	slice_operation(len(s), s)
	for i := 0; i < len(s); i++ {
		fmt.Printf("s[%v] = %v\n", i, s[i])
	}

	for i := 0; i < len(s); i++ {
		s[i] = i
	}

	fmt.Printf("s address: %p, s address: %p, s: %v, len(s): %v, cap(s): %v\n", &s, s, s, len(s), cap(s))

	for i := 0; i < len(s); i++ {
		fmt.Printf("s[%v] = %v\n", i, s[i])
	}

	slice_operation(20, s)
	fmt.Printf("s address: %p, s address: %p, s: %v, len(s): %v, cap(s): %v\n", &s, s, s, len(s), cap(s))

	for i := 0; i < len(s); i++ {
		fmt.Printf("&s[%v] = %p, s[%v] = %v\n", i, &s[i], i, s[i])
	}

	ptr := unsafe.Pointer(&s[0])
	for i := 0; i < 20; i++ {
		c := (* int)(unsafe.Pointer((uintptr(ptr)) + uintptr(8 * i)))
		fmt.Printf("c = %p, *c = %v\n",c, *c)
	}

	for i := 0; i < 20; i++ {
		s = append(s, i)
	}
	fmt.Printf("s address: %p, s address: %p, s: %v, len(s): %v, cap(s): %v\n", &s, s, s, len(s), cap(s))
}

func slice_test_02() {
	fmt.Printf("\n############################## slice_test_02 ##############################\n")

	s := make([]int, 10, 100)

	fmt.Printf("s address: %p, s address: %p, s: %v, len(s): %v, cap(s): %v\n", &s, s, s, len(s), cap(s))

	for i := 0; i < len(s); i++ {
		s[i] = i
	}

	for i := 0; i < len(s); i++ {
		fmt.Printf("&s[%v] = %p, s[%v] = %v\n", i, &s[i], i, s[i])
	}

	slice_operation_ptr(len(s), &s)
	for i := 0; i < len(s); i++ {
		fmt.Printf("s[%v] = %v\n", i, s[i])
	}

	for i := 0; i < len(s); i++ {
		s[i] = i
	}

	fmt.Printf("s address: %p, s address: %p, s: %v, len(s): %v, cap(s): %v\n", &s, s, s, len(s), cap(s))

	for i := 0; i < len(s); i++ {
		fmt.Printf("s[%v] = %v\n", i, s[i])
	}

	slice_operation_ptr(20, &s)
	fmt.Printf("s address: %p, s address: %p, s: %v, len(s): %v, cap(s): %v\n", &s, s, s, len(s), cap(s))

	for i := 0; i < len(s); i++ {
		fmt.Printf("&s[%v] = %p, s[%v] = %v\n", i, &s[i], i, s[i])
	}

	ptr := unsafe.Pointer(&s[0])
	for i := 0; i < 20; i++ {
		c := (* int)(unsafe.Pointer((uintptr(ptr)) + uintptr(8 * i)))
		fmt.Printf("c = %p, *c = %v\n",c, *c)
	}

	for i := 0; i < 20; i++ {
		s = append(s, i)
	}
	fmt.Printf("s address: %p, s address: %p, s: %v, len(s): %v, cap(s): %v\n", &s, s, s, len(s), cap(s))
}

/*
slice作为参数，可以修改slice的内容，但是slice的底层数据结构的值不能被修改到，比如len，cap等
如果需要修改到底层的数据结构(len, cap)，则需要传递slice的地址
如下为猜测：
也就是说，slice本身的数据结构与实际指向的内存空间不统一，如果要改变数据结构，则需要传递slice的地址
slice作为参数，只是传递slice所指向的地址，而slice本身的数据结构是没有传递的，所以go语言不存在引用传递，都是值传递
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	slice_test_01()
	slice_test_02()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
