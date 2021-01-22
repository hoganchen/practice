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
https://www.cnblogs.com/mushroom/p/8998538.html
涉及逃逸，结合原理来理解
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	s := []byte("")
	// fmt.Printf("s data address: %p, s value: %v, len(s): %v, cap(s): %v\n", s, s, len(s), cap(s))

	s1 := append(s, 'a')
	// fmt.Printf("s data address: %p, s value: %v, len(s): %v, cap(s): %v\n", s, s, len(s), cap(s))
	// fmt.Printf("s1 data address: %p, s1 value: %v, len(s1): %v, cap(s1): %v\n", s1, s1, len(s1), cap(s1))

	s2 := append(s, 'b')
	// fmt.Printf("s data address: %p, s value: %v, len(s): %v, cap(s): %v\n", s, s, len(s), cap(s))
	// fmt.Printf("s1 data address: %p, s1 value: %v, len(s1): %v, cap(s1): %v\n", s1, s1, len(s1), cap(s1))
	// fmt.Printf("s2 data address: %p, s2 value: %v, len(s2): %v, cap(s2): %v\n", s2, s2, len(s2), cap(s2))

	/*
	我们用go tool compile测试一下
	go tool compile -m pro_2.go
	*/
	// 打开或者关闭如下注释，得到的结果不一致，并且跟go的版本也有关系
	// fmt.Println(s1, "==========", s2)
	fmt.Println(string(s1), "==========", string(s2))

	ss := []byte{}
	ss1 := append(ss, 'a')
	ss2 := append(ss, 'b')
	fmt.Printf("ss data address: %p, ss value: %v, len(ss): %v, cap(ss): %v\n", ss, ss, len(ss), cap(ss))
	fmt.Printf("ss1 data address: %p, ss1 value: %v, len(ss1): %v, cap(ss1): %v\n", ss1, ss1, len(ss1), cap(ss1))
	fmt.Printf("ss2 data address: %p, ss2 value: %v, len(ss2): %v, cap(ss2): %v\n", ss2, ss2, len(ss2), cap(ss2))

	// 打开或者关闭如下注释，得到的结果一致
	fmt.Println(ss1, "==========", ss2)
	fmt.Println(string(ss1), "==========", string(ss2))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
