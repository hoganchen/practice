package main

import (
	"fmt"
)

// golang是值传递，函数中修改形参sl导致其扩容，不会影响到函数外部的实参值，
// 虽然slice是引用类型，但是函数调用时，sl参数是实际参数值的拷贝，其形参的数据结构的地址不同与实参值，
// 但是初始指向的底层数组是同一个地址，如果不发生扩容，对形参数据的修改会影响到实参，
// 但是如果发生扩容，形参指向的底层数组已经不同与实参的底层数组了，所以就不能影响到实参值
func sliceExtend(sl []int) {
	for i := 0; i < 2; i++ {
		sl = append(sl, sl...)
	}

	fmt.Printf("len(sl): %v, cap(sl): %v, sl: %v\n", len(sl), cap(sl), sl)
}

// 由于参数是指针，虽然指针变量的地址不同与实参，但是指针所指向的地址是实参的地址，所以在函数中，
// 对形参的修改会影响到实参
func sliceExtendPtr(sl *[]int) {
	for i := 0; i < 2; i++ {
		*sl = append(*sl, *sl...)
	}

	fmt.Printf("len(sl): %v, cap(sl): %v, sl: %v\n", len(*sl), cap(*sl), *sl)
}

func main() {
	sl := []int{1,2}
	fmt.Printf("len(sl): %v, cap(sl): %v, sl: %v\n", len(sl), cap(sl), sl)
	sliceExtend(sl)
	fmt.Printf("len(sl): %v, cap(sl): %v, sl: %v\n", len(sl), cap(sl), sl)

	fmt.Printf("\n################################################################################\n")

	s := []int{1,2}
	fmt.Printf("len(s): %v, cap(s): %v, s: %v\n", len(s), cap(s), s)
	sliceExtendPtr(&s)
	fmt.Printf("len(s): %v, cap(s): %v, s: %v\n", len(s), cap(s), s)
}
