package main

import "fmt"

func a() {
	i := 0
	// 压栈的数据为当前的数据，而不是之后的新数据
    defer fmt.Println(i)
    i++
    return
}

/*
defer 栈

推迟的函数调用会被压入一个栈中。当外层函数返回时，被推迟的函数会按照后进先出的顺序调用。
更多关于 defer 语句的信息，请阅读此博文(https://blog.go-zh.org/defer-panic-and-recover)。
*/
func main() {
	fmt.Println("counting")

	for i := 0; i < 10; i++ {
		defer fmt.Println(i)
	}

	fmt.Println("done")
	// fmt.Println(a())
	fmt.Println(a)
	a()
}
