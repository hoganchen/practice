/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
)

type Currency int
const (
	USD Currency = iota	// 美元
	EUR					// 欧元
	GBP					// 英镑
	RMB					// 人民币
)

func main() {
	fmt.Printf("Hello world!\n")

	// 数组的每个元素可以通过索引下标来访问,索引下标的范围是从0开始到数组长度减1的位置。内置的len函数将返回数组中元素的个数。
	var aa [5]int = [5]int{1, 2, 3, 4, 5}
	fmt.Printf("aa[0]: %v\n", aa[0])
	fmt.Printf("aa[len(aa) - 1]: %v\n", aa[len(aa) - 1])

	for i, v := range aa {
		fmt.Printf("aa[%v] = %v\n", i, v)
	}

	for _, v := range aa {
		fmt.Printf("%v\n", v)
	}

	var r [5]int = [5]int{7, 8, 9}
	for i, v := range r {
		fmt.Printf("r[%v] = %v\n", i, v)
	}

	// 在数组字面值中,如果在数组的长度位置出现的是“...”省略号,则表示数组的长度是根据初始化值的个数来计算。
	q := [...]int{10, 11, 12, 14, 15}
	fmt.Printf("\nlen(q) = %v\n", len(q))
	for i, v := range q {
		fmt.Printf("q[%v] = %v\n", i, v)
	}

	p := [10]int{20, 21, 22, 23, 24}
	fmt.Printf("\nlen(p) = %v\n", len(p))
	for i, v := range p {
		fmt.Printf("p[%02v] = %v\n", i, v)
	}

	// 根据索引位置初始化数组
	s := [10]int{4: 20, 5: 21, 7: 22, 8: 23, 9: 24}
	fmt.Printf("\nlen(s) = %v\n", len(s))
	for i, v := range s {
		fmt.Printf("p[%02v] = %v\n", i, v)
	}

	// 长度推导，数组长度为10
	t := [...]int{1: 20, 2: 21, 7: 22, 8: 23, 9: 24}
	fmt.Printf("\nlen(t) = %v\n", len(t))
	for i, v := range t {
		fmt.Printf("p[%02v] = %v\n", i, v)
	}

	symbol := [...]string{USD: "$", EUR: "€", GBP: "£", RMB: "¥"}
	fmt.Printf("\nlen(symbol) = %v\n", len(symbol))
	for i, v := range symbol {
		fmt.Printf("symbol[%02v] = %v\n", i, v)
	}

	// 如果一个数组的元素类型是可以相互比较的,那么数组类型也是可以相互比较的,这时候我们可以直接通过==比较运算符来比较两个数组,
	// 只有当两个数组的所有元素都是相等的时候数组才是相等的。
	a := [2]int{1, 2}
	b := [...]int{1, 2}
	c := [2]int{1, 3}
	fmt.Println(a == b, a == c, b == c) // "true false false"
	// d := [3]int{1, 2}
	// fmt.Println(a == d)	//	compile	error:	cannot	compare	[2]int	==	[3]int
}
