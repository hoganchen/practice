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

// 使用结构体指针实现接口
func(c *Cat) Walk() {
	fmt.Println("cat walk")
}

func (c *Cat) Quack() {
	fmt.Println("meow...")
}

// 使用结构体实现接口
// method redeclared: Cat.Walk
// func(c Cat) Walk() {
// 	fmt.Println("cat walk")
// }

// method redeclared: Cat.Quack
// func (c Cat) Quack() {
// 	fmt.Println("meow...")
// }

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var i Duck
	i = new(Cat)
	i.Walk()
	i.Quack()

	var pd Duck = &Cat{} // 使用结构体指针初始化变量
	pd.Walk()
	pd.Quack()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
