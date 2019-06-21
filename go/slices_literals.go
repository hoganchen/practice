package main

import "fmt"

/*
切片文法类似于没有长度的数组文法。

这是一个数组文法：
[3]bool{true, true, false}

下面这样则会创建一个和上面相同的数组，然后构建一个引用了它的切片：
[]bool{true, true, false}
*/
func main() {
	// 创建数组
	qa := [...]int{2, 3, 5, 7, 11, 13}  // 创建一个长度为6的整型数组
	qaa := [6]int{2, 3, 5, 7, 11, 13}  // 创建一个长度为6的整型数组
	qaaa := [10]int{2, 3, 5, 7, 11, 13}  // 创建一个长度为10的整型数组，前6个数已初始化，后4四个数默认初始化为0

	// 创建数组时不申明长度，则是创建数组并构建一个引用了它的切片
	q := []int{2, 3, 5, 7, 11, 13}
	fmt.Println(q)

	r := []bool{true, false, true, true, false, true}
	fmt.Println(r)

	s := []struct {
		i int
		b bool
	}{
		{2, true},
		{3, false},
		{5, true},
		{7, true},
		{11, false},
		{13, true},
	}
	fmt.Println(s)
}
