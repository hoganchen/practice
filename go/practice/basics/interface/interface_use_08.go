/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func findType(i interface{}) {
    switch i.(type) {
    case string:
        fmt.Printf("String: %s\n", i.(string))
    case int:
        fmt.Printf("Int: %d\n", i.(int))
    default:
        fmt.Printf("Unknown type\n")
    }
}

/*
类型判断

类型判断的语法类似于类型断言。在类型断言的语法i.（type）中，类型type应该由类型转换的关键字type替换。让我们看看它如何在下面的程序中起作用。
https://studygolang.com/articles/12560
*/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	findType("Naveen")
    findType(77)
	findType(89.98)

	var s interface{}
	s = 10
	fmt.Println("s.(int):", s.(int))
	s = "hello world"
	fmt.Println("s.(string):", s.(string))

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
