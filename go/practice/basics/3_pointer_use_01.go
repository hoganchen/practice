/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

// 函数可变数量参数
func variableParam(args ...string) {
	for _, value := range args {
		fmt.Printf("value: %v\n", value)
	}
}

// https://melonshell.github.io/2020/03/27/go11_3dot/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	variableParam("jerry", "herry")
	names := []string{"jerry", "herry"}
	variableParam(names...)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
