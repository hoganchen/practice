/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

/*
代码的运行结果并不符合我们的预期,这个现象背后的原因是什么呢?经过分析,我们会发现调用defer关键字会立刻对函数中引用的外部参数进行拷贝,
所以time.Since(startedAt)的结果不是在main函数退出之前计算的,而是在defer关键字调用时计算的,最终导致上述代码输出0s。

想要解决这个问题的方法非常简单,我们只需要向defer关键字传入匿名函数。
虽然调用defer关键字时也使用值传递,但是因为拷贝的是函数指针,
所以time.Since(startedAt)会在main函数执行前被调用并打印出符合预期的结果。
*/
func defer_01() {
	startedAt := time.Now()

	defer fmt.Println("time since:",time.Since(startedAt))

	time.Sleep(time.Duration(5) * time.Second)
}


func defer_02() {
	startedAt := time.Now()

	defer func() {fmt.Println("time since:",time.Since(startedAt))}()

	time.Sleep(time.Duration(5) * time.Second)
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	defer_01()
	defer_02()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
