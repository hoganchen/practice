/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func assert(i interface{}) {
    v, ok := i.(int)
    fmt.Println(v, ok)
}

/*
类型断言

类型断言用于提取接口的基础值，语法：i.(T)
https://studygolang.com/articles/12560
*/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	var s interface{} = 56
    assert(s)
    var i interface{} = "Steven Paul"
    assert(i)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
