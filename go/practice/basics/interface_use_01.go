/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

type Human interface {
    Say()
}

type Man struct {
}

type Woman struct {
}

func (m Man) Say() {
    fmt.Println("I'm a man")
}

func (w *Woman) Say() {
    fmt.Println("I'm a woman")
}

// https://zhuanlan.zhihu.com/p/63219494
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	humans := []Human{Man{}, &Woman{}}
    for _, human := range humans {
        human.Say()
    }

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
