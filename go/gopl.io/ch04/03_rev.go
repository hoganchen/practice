package main

import "fmt"

/*
因为slice值包含指向第一个slice元素的指针,因此向函数传递slice将允许在函数内部修改底层数组的元素。
换句话说,复制一个slice只是对底层的数组创建了一个新的slice别名(§2.3.2)。
下面的reverse函数在原内存空间将[]int类型的slice反转,而且它可以用于任意长度的slice。
*/
func main() {
	a := [...]int{0, 1, 2, 3, 4, 5}
	fmt.Printf("type: %T, cap: %d, len: %d\n", a, cap(a), len(a))
	reverse(a[:])
	fmt.Println(a) // "[5 4 3 2 1 0]"

	s := []int{0, 1, 2, 3, 4, 5}
	// Rotate s left by two positions
	reverse(s[:2])
	reverse(s[2:])
	reverse(s)
	fmt.Println(s) // "[2 3 4 5 0 1]"
}

// reverse reverses a slice of ints in place.
func reverse(s []int) {
	for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
		s[i], s[j] = s[j], s[i]
	}
}
