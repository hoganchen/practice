package main

import "fmt"

/*

用 make 创建切片

切片可以用内建函数 make 来创建，这也是你创建动态数组的方式。

make 函数会分配一个元素为零值的数组并返回一个引用了它的切片：

a := make([]int, 5)  // len(a)=5

要指定它的容量，需向 make 传入第三个参数：

b := make([]int, 0, 5) // len(b)=0, cap(b)=5

b = b[:cap(b)] // len(b)=5, cap(b)=5
b = b[1:]      // len(b)=4, cap(b)=4

*/
func main() {
	// 5个元素，len=5，都初始化为0
	a := make([]int, 5)
	printSlice("a", a)

	// 容量为0，0个元素，len=0
	b := make([]int, 0, 5)
	printSlice("b", b)

	// 必须扩展，不然会报错
	e := b[:5]
	printSlice("e", e)
	e[0] = 0
	e[1] = 1
	e[2] = 2
	e[3] = 3
	e[4] = 4

	c := b[:2]
	printSlice("c", c)

	d := c[2:5]
	printSlice("d", d)
}

func printSlice(s string, x []int) {
	fmt.Printf("%s len=%d cap=%d %v\n",
		s, len(x), cap(x), x)
}
