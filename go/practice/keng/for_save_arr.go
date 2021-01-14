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
第二个例子是使用Go语言经常会犯的错误。当我们在遍历一个数组时,如果获取range返回变量的地址并保存到另一个数组或者哈希时,
就会遇到令人困惑的现象

上述代码最终会输出三个连续的3,这个问题比较常见,一些有经验的开发者不经意也会犯这种错误,正确的做法应该是使用&arr[i]替代&v,
我们会在下面分析这一现象背后的原因
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	arr := []int{1, 2, 3}
	newArr := []*int{}

	// 因为v是一个临时变量，有自己的内存地址，所以如下代码是把v的地址存放在newArr中，在最后一轮循环执行后，v的值为3
	for i, v := range arr {
		fmt.Printf("&arr[%v] = %p, &v = %p\n", i, &arr[i], &v)
		newArr = append(newArr, &v)
	}

	for _, v := range newArr {
		fmt.Printf("v = %v, *v = %v\n", v, *v)
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
