/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
@Description:   golang程序模板
*/

/*
go mod管理包
mkdir trade
cd trade
go mod init trade

go mod下载缺失的库
go mod tidy
*/
package main

import (
	"flag"
	"fmt"
	"time"
)

func debugFunc() {
}

func mainFunc() {
}

//go run goTemplate.go --debug=true > debug.log 2>&1
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	debugFlag := flag.Bool("debug", false, "The debug flag")
	flag.Parse()

	if false == *debugFlag {
		mainFunc()
	} else {
		debugFunc()
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
