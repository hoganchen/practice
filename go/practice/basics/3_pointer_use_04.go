/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

// 数组元素数量
// https://melonshell.github.io/2020/03/27/go11_3dot/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	// 如果忽略数组[]中的数字不设置大小，...指定的长度等于数组中元素的数量，Go语言会根据元素的个数设置数组的大小。
	stooges := [...]string{"Moe", "Larry", "Curly"} //等价于stooges := [3]string{"Moe", "Larry", "Curly"}
	arr := [...]int{1, 2, 3}
	fmt.Println(len(stooges))
	fmt.Println(len(arr))

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
