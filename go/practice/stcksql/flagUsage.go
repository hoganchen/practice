/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"flag"
	"fmt"
	"time"
)

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	////go run flagUsage.go -d -u hogan -n 200
	//var debugFlag bool
	//var userName string
	//var threadNum int
	//flag.BoolVar(&debugFlag, "d", false, "The debug output flag")
	//flag.StringVar(&userName, "u", "root", "The user name")
	//flag.IntVar(&threadNum, "n", 100, "The thread number")
	//flag.Parse()
	//fmt.Printf("debugFlag: %v, userName: %v, threadNum: %v\n", debugFlag, userName, threadNum)

	//go run flagUsage.go --debug --user hogan --num 200
	debugFlag := flag.Bool("debug", false, "The debug output flag")
	userName := flag.String("user", "root", "The user name")
	threadNum := flag.Int("num", 100, "The thread number")
	flag.Parse()
	fmt.Printf("debugFlag: %v, userName: %v, threadNum: %v\n", *debugFlag, *userName, *threadNum)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
