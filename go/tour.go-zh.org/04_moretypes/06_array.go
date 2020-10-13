package main

import "fmt"

/*

数组

类型 [n]T 表示拥有 n 个 T 类型的值的数组。

表达式

var a [10]int

会将变量 a 声明为拥有 10 个整数的数组。


数组的长度是其类型的一部分，因此数组不能改变大小。这看起来是个限制，不过没关系，Go 提供了更加便利的方式来使用数组。

Go的切片是在数组之上的抽象数据类型，因此在了解切片之前必须要先理解数组。

数组类型定义了长度和元素类型。例如， [4]int 类型表示一个四个整数的数组。 数组的长度是固定的，长度是数组类型的一部分（ [4]int 和 [5]int 是完全不同的类型）。 数组可以以常规的索引方式访问，表达式 s[n] 访问数组的第 n 个元素。
*/
func main() {
	var a [2]string
	a[0] = "Hello"
	a[1] = "World"
	fmt.Println(a[0], a[1])
	fmt.Println(a)

	primes := [6]int{2, 3, 5, 7, 11, 13}
	fmt.Println(primes)

	arr1 := [6]int{1, 3, 5, 7, 9}
	fmt.Println(arr1)

	arr2 := [4]int{}
	fmt.Println(arr2)

	arr3 := []int{1,2,3,4,5}
	fmt.Println(arr3, len(arr3))

	arr4 := [...]int{1, 2, 3, 4, 5, 6, 7, 8}
	fmt.Println(arr4, len(arr4))

	// arr5 := [10]int
	var arr5 [10]int
	fmt.Println(arr5, len(arr5))
}
