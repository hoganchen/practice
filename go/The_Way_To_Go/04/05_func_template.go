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
因此符合规范的函数一般写成如下的形式:
func functionName(parameter_list) (return_value_list) {
	...
}
其中:
parameter_list的形式为(param1 type1, param2 type2, ...)
return_value_list的形式为(ret1 type1, ret2 type2, ...)
只有当某个函数需要被外部包调用的时候才使用大写字母开头,并遵循Pascal命名法;否则就遵循骆驼命名法,
即第一个单词的首字母小写,其余单词的首字母大写。
*/
func functionName(a, b int) int {
	return (a + b) * (a - b)
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
