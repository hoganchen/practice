/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

type Test interface {
	Tester()
}

type MyFloat float64

func (m MyFloat) Tester() {
	fmt.Println(m)
}

func describe(t Test) {
	fmt.Printf("Interface 类型 %T ,  值： %v\n", t, t)
}

/*
接口的内部表现

一个接口可以被认为是由一个元组（类型，值）在内部表示的。type是接口的基础具体类型，value是具体类型的值。
https://studygolang.com/articles/12560
*/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	var t Test
	f := MyFloat(89.7)
	t = f
	describe(t)
	t.Tester()

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
