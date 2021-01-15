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
程序首先运行panic，出现故障，此时跳转到包含recover()的defer函数执行，recover捕获panic，此时panic就不继续传递．
但是recover之后，程序并不会返回到panic那个点继续执行以后的动作，而是在recover这个点继续执行以后的动作，
即执行上面的defer函数，输出"In goroutine...".

注意：利用recover处理panic指令，必须利用defer在panic之前声明，否则当panic时，recover无法捕获到panic，无法防止panic扩散．
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	defer fmt.Println("In main...")

	go func() {
		defer func() {
			defer fmt.Println("In goroutine...")

			if err := recover(); err != nil {
				fmt.Println("Error:", err)
			}
		}()

		panic("Error: Unknown error")

		fmt.Println("After panic...")
	}()

	time.Sleep(2 * time.Second)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
