/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	str := "Go is a beautiful language!"
	fmt.Printf("The length of str is: %d\n", len(str))

	for pos, ch := range str {
		fmt.Printf("character on position %d is: %c\n", pos, ch)
	}

	// 输出结果: 0 0 0 0 0，v变量在每轮循环重新创建并自动初始化
	for i := 0; i < 5; i++ {
		var v int
		fmt.Printf("v address: %p, v value: %d\n", &v, v)
		v += 1
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
