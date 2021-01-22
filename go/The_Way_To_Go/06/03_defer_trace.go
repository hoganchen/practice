/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func trace(s string) string {fmt.Printf("time.Now(): %v, entering: %v\n", time.Now(), s); return s}
func untrace(s string) {fmt.Printf("time.Now(): %v, leaving: %v\n", time.Now(), s)}

func a() {
	defer untrace(trace("a"))
	fmt.Println("in a")
	time.Sleep(5 * time.Second)
}

func b() {
	defer untrace(trace("b"))
	fmt.Println("in b")
	a()
	time.Sleep(5 * time.Second)
}

/*
调用defer关键字会立刻对函数中引用的外部参数进行拷贝,我们只需要向defer关键字传入函数。
虽然调用defer关键字时也使用值传递,但是因为拷贝的是函数指针,
所以time.Now()会在defer函数执行时计算并打印出符合预期的结果。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	b()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
