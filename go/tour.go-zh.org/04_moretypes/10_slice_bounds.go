package main

import "fmt"

/*

切片的默认行为

在进行切片时，你可以利用它的默认行为来忽略上下界。

切片下界的默认值为 0，上界则是该切片的长度。

对于数组

var a [10]int

来说，以下切片是等价的：

a[0:10]
a[:10]
a[0:]
a[:]

*/
func main() {
	s := []int{2, 3, 5, 7, 11, 13}

	s = s[1:4]
	fmt.Println(s)

	s = s[:2]
	fmt.Println(s)

	s = s[1:]
	fmt.Println(s)

	// 可以理解为s为指向数据的指针，通过切片的方式来移动指针，且只能向后移动，并且也可以扩展到当前指向的元素与后面元素的个数
	s = s[:4]
	fmt.Println(s)
}
