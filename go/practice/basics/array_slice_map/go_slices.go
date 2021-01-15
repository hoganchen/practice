/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

 // 从切片中删除元素
 func SliceDelete() {
	// 初始化一个新的切片 seq
	seq := []string{"a", "b", "c", "d", "e", "f", "g"}

	// 指定删除位置
	index := 3

	// 输出删除位置之前和之后的元素
	fmt.Println(seq[:index], seq[index+1:])

	// seq[index+1:]... 表示将后段的整个添加到前段中，...的作用是展开slice
	// 将删除前后的元素连接起来
	seq = append(seq[:index], seq[index+1:]...)

	// 输出链接后的切片
	fmt.Println(seq)
}

// https://www.php.cn/be/go/439579.html
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	SliceDelete()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
