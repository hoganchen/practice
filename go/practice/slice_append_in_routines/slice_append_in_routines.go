/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func test() {
	var a []int

	for i := 0; i < 10000; i++ {
		go func() {
			a = append(a, 1) // 多协程并发读写slice
		}()
	}

	fmt.Println(len(a))
}

/*
slice不是协程安全的，所以在多个协程中读写slice是不安全的，在高并发的情况下会产生不可控制的错误。
错误的使用方式
输出结果可能不等于期望的值
https://www.cnblogs.com/zcqkk/p/11772173.html
*/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	test()

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
