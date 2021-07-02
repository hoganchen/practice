/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"./geometry"
)

func main() {
	fmt.Printf("Hello world!\n")
	xx := geometry.Point{X:1, Y:2}
	yy := geometry.Point{X:3, Y:4}

	/*
	可以看到,下面的两个函数调用都是Distance,但是却没有发生冲突。第一个Distance的调用实际上用的是包级别的函数geometry.Distance,
	而第二个则是使用刚刚声明的Point,调用的是Point类下声明的Point.Distance方法。

	这种p.Distance的表达式叫做选择器,因为他会选择合适的对应p这个对象的Distance方法来执行。
	选择器也会被用来选择一个struct类型的字段,比如p.X。由于方法和字段都是在同一命名空间,
	所以如果我们在这里声明一个X方法的话,编译器会报错,因为在调用p.X时会有歧义(译注:这里确实挺奇怪的)。
	*/
	fmt.Printf("Distance: %v\n", geometry.Distance(xx, yy))
	fmt.Printf("Distance: %v\n", yy.Distance(xx))

	pp := geometry.Path{geometry.Point{X:1, Y:2}, geometry.Point{X:3, Y:4}, geometry.Point{X:5, Y:6}}
	fmt.Printf("Distance: %v\n", pp.Distance())
}
