/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"log"
	"time"
)

const (
	LOGLEVEL = "debug"
)

func logPrintf(level string, format string, a ...interface{}) {
	switch level {
	case "debug":
		;
	case "log":
		;
	case "warn":
		;
	default:
		;
	}
	log.Printf(format, a)
}

func logInit() {
	log.SetFlags(log.Lshortfile | log.Ltime | log.Ldate)
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
