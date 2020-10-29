package main

import (
	"fmt"
)

func newInt_01() *int {
    return new(int)
}

func newInt_02() *int {
    var dummy int
    return &dummy
}

/*
另一个创建变量的方法是调用用内建的new函数。表达式new(T)将创建一个T类型的匿名变量,初始化为T类型的零值,然后返回变量地址,返回的指针类型为*T。

用new创建变量和普通变量声明语句方式创建变量没有什么区别,除了不需要声明一个临时变量的名字外,我们还可以在表达式中使用new(T)。
换言之,new函数类似是一种语法糖,而不是一个新的基础概念。
*/
func main() {
	p := new(int)	//p, *int类型,指向匿名的int变量
	// fmt.Println(*p)	//"0"
	fmt.Printf("p = %v, *p = %v\n", p, *p)
	*p = 2			//设置int匿名变量的值为2
	// fmt.Println(*p)	//"2"
	fmt.Printf("p = %v, *p = %v\n", p, *p)

	// 每次调用new函数都是返回一个新的变量的地址,因此下面两个地址是不同的
	p, q := new(int), new(int)
	fmt.Printf("p == q ? %v\n", p == q)
	fmt.Printf("p = %v, q = %v\n", p, q)

	m, n := newInt_01(), newInt_02()
	fmt.Printf("m == n ? %v\n", m == n)
	fmt.Printf("m = %v, n = %v\n", m, n)

	x, y := newInt_01(), newInt_02()
	fmt.Printf("x == y ? %v\n", x == y)
	fmt.Printf("x = %v, y = %v\n", x, y)

	// 当然也可能有特殊情况:如果两个类型都是空的,也就是说类型的大小是0,例如struct{}和[0]int,有可能有相同的地址(依赖具体的语言实现)
	i, j := new(struct{}), new([0]int)
	// fmt.Printf("i == j ? %v\n", i == j)
	fmt.Printf("i = %v, j = %v\n", &i, &j)
}
