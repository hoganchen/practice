package main

import (
	"fmt"
	"unsafe"
)

func SizeOf[T any]() uintptr {
	var zero T
	return unsafe.Sizeof(zero)
}

func main() {
	fmt.Println("SizeOf int is ", SizeOf[int]())
	fmt.Println("SizeOf uintptr is ", SizeOf[uintptr]())
	fmt.Println("SizeOf string is ", SizeOf[string]())
	fmt.Println("SizeOf map[int]int is ", SizeOf[map[int]int]())
	fmt.Println("SizeOf map[string]string is ", SizeOf[map[string]string]())
	fmt.Println("SizeOf [10]int is ", SizeOf[[10]int]())
	/*
		type SliceHeader struct {
		Data uintptr  //引用数组指针地址
		Len  int     // 切片的目前使用长度
		Cap  int     // 切片的容量
		}
	*/
	fmt.Println("SizeOf []int is ", SizeOf[[]int]())       //根据切片的数据结构，该数据结构有3个元素，所以size为24字节(64位系统)
	fmt.Println("SizeOf []string is ", SizeOf[[]string]()) //根据切片的数据结构，该数据结构有3个元素，所以size为24字节(64位系统)
}
