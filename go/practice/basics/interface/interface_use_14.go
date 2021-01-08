/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

type Duck interface {
	Walk()
	Quack()
}

type Cat struct{}
type Cow struct{}

// // 使用结构体指针实现接口
// func(c *Cat) Walk() {
// 	fmt.Println("cat walk")
// }

// func (c *Cat) Quack() {
// 	fmt.Println("meow...")
// }

// 使用结构体实现接口
func(c Cat) Walk() {
	fmt.Println("cat walk")
}

func (c Cat) Quack() {
	fmt.Println("meow...")
}

// 与interface_use_13.go结合起来分析执行结果

/*
                            结构体实现接口        结构体指针实现接口
结构体初始化变量               通过                不通过
结构体指针初始化变量            通过                通过
四种中只有『使用指针实现接口,使用结构体初始化变量』无法通过编译,其他的三种情况都可以正常执行。
当实现接口的类型和初始化变量时返回的类型时相同时,代码通过编译是理所应当的:
  方法接受者和初始化类型都是结构体;
  方法接受者和初始化类型都是结构体指针;

而剩下的两种方式为什么一种能够通过编译,另一种无法通过编译呢?我们先来看一下能够通过编译的情况,
也就是方法的接受者是结构体,而初始化的变量是结构体指针

作为指针的&Cat{}变量能够隐式地获取到指向的结构体,所以能在结构体上调用Walk和Quack方法。
我们可以将这里的调用理解成C语言中的d->Walk()和d->Speak(),它们都会先获取指向的结构体再执行对应的方法。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var i Duck
	i = Cat{}
	i.Walk()
	i.Quack()

	i = new(Cat)
	i.Walk()
	i.Quack()

	var d Duck = Cat{} // 使用结构体初始化变量
	d.Walk()
	d.Quack()

	var pd Duck = &Cat{} // 使用结构体指针初始化变量
	pd.Walk()
	pd.Quack()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
