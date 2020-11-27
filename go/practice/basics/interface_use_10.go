/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

type Describer interface {
    Describe()
}
type St string

func (s St) Describe() {
    fmt.Println("被调用le!")
}

func findType(i interface{}) {
    switch v := i.(type) {
    case Describer:
        v.Describe()
    case string:
        fmt.Println("String 变量")
    default:
        fmt.Printf("unknown type\n")
    }
}

// https://studygolang.com/articles/12560
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	findType("Naveen")
    st := St("我的字符串")
    findType(st)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
