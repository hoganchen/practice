/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func PrintAll(vals []interface{}) {
    for _, val := range vals {
        fmt.Println("I am", val)
    }
}

// https://zhuanlan.zhihu.com/p/63219494
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	names := []string{"stanley", "david", "oscar"}
    vals := make([]interface{}, len(names))
    for i, v := range names {
        vals[i] = v
    }
    PrintAll(vals)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}