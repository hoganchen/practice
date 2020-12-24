/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"golang.org/x/net/context"
)

func Speak(ctx context.Context) {
	for range time.Tick(time.Second){
		select {
		case <- ctx.Done():
			return
		default:
			fmt.Println("balabalabalabala")
		}
	}
}

/*
我们使用withCancel创建一个基于Background的ctx，然后启动一个讲话程序，每隔1s说一话，main函数在10s后执行cancel，
那么speak检测到取消信号就会退出。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go Speak(ctx)
	time.Sleep(10 * time.Second)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
