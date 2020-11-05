/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
)

/*
和数组不同的是,slice之间不能比较,因此我们不能使用==操作符来判断两个slice是否含有全部相等元素。
不过标准库提供了高度优化的bytes.Equal函数来判断两个字节型slice是否相等([]byte),但是对于其他类型的slice,我们必须自己展开每个元素进行比较

上面关于两个slice的深度相等测试,运行的时间并不比支持==操作的数组或字符串更多,但是为何slice不直接支持比较运算符呢?这方面有两个原因。
第一个原因,一个slice的元素是间接引用的,一个slice甚至可以包含自身。
第二个原因,因为slice的元素是间接引用的,一个固定值的slice在不同的时间可能包含不同的元素,因为底层数组的元素可能会被修改。
*/
func equal(x, y []string) bool {
	if len(x) != len(y) {
		return false
	}
	for i := range x {
		if x[i] != y[i] {
			return false
		}
	}
	return true
}

func main() {
	fmt.Printf("Hello world!\n\n")
	a := [...]int{0, 1, 2, 3, 4, 5}
	fmt.Printf("type(a): %T, cap: %d, len: %d\n", a, cap(a), len(a))

	fmt.Printf("\n")

	/*
	slice唯一合法的比较操作是和nil比较

	一个零值的slice等于nil。一个nil值的slice并没有底层数组。一个nil值的slice的长度和容量都是0,
	但是也有非nil值的slice的长度和容量也是0的,例如[]int{}或make([]int, 3)[3:]。与任意类型的nil值一样,
	我们可以用[]int(nil)类型转换表达式来生成一个对应类型slice的nil值。

	如果你需要测试一个slice是否是空的,使用len(s) == 0来判断,而不应该用s == nil来判断。
	除了和nil相等比较外,一个nil值的slice的行为和其它任意0长度的slice一样;例如reverse(nil)也是安全的。
	除了文档已经明确说明的地方,所有的Go语言函数应该以相同的方式对待nil值的slice和0长度的slice。
	*/
	var s []int
	fmt.Printf("type(s): %T, cap: %d, len: %d\n", s, cap(s), len(s))
	if s == nil {
		fmt.Printf("s is nil\n")
	}

	s = []int{}
	fmt.Printf("type(s): %T, cap: %d, len: %d\n", s, cap(s), len(s))
	if s == nil {
		fmt.Printf("s is nil\n")
	} else {
		fmt.Printf("s is not nil\n")
	}

	s = []int(nil)
	fmt.Printf("type(s): %T, cap: %d, len: %d\n", s, cap(s), len(s))
	if s == nil {
		fmt.Printf("s is nil\n")
	} else {
		fmt.Printf("s is not nil\n")
	}

	s = nil
	fmt.Printf("type(s): %T, cap: %d, len: %d\n", s, cap(s), len(s))
	if s == nil {
		fmt.Printf("s is nil\n")
	} else {
		fmt.Printf("s is not nil\n")
	}

	/*
	内置的make函数创建一个指定元素类型、长度和容量的slice。容量部分可以省略,在这种情况下,容量将等于长度。

	在底层,make创建了一个匿名的数组变量,然后返回一个slice;只有通过返回的slice才能引用底层匿名的数组变量。
	在第一种语句中,slice是整个数组的view。在第二个语句中,slice只引用了底层数组的前len个元素,但是容量将包含整个的数组。
	额外的元素是留给未来的增长用的。
	*/
	r := make([]int, 5)
	fmt.Printf("type: %T, cap: %d, len: %d\n", r, cap(r), len(r))
	t := make([]int, 5, 10) // same as make([]T, cap)[:len]
	fmt.Printf("type: %T, cap: %d, len: %d\n", t, cap(t), len(t))

	// 在循环中使用append函数构建一个由九个rune字符构成的slice,当然对应这个特殊的问题我们可以通过Go语言内置的[]rune("Hello, 世界")转换操作完成。
	var runes []rune
	for _, r := range "Hello, 世界" {
		runes = append(runes, r)
	}
	fmt.Printf("%q\n", runes) // "['H' 'e' 'l' 'l' 'o' ',' ' ' '世' '界']"

	var x []int
	x = append(x, 1)
	x = append(x, 2, 3)
	x = append(x, 4, 5, 6)
	x = append(x, x...) // append the slice x
	fmt.Println(x) // "[1 2 3 4 5 6 1 2 3 4 5 6]"
}
