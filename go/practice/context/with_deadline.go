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

func Monitor(ctx context.Context) {
	select {
	case <- ctx.Done():
		fmt.Println(ctx.Err())
	case <- time.After(20 * time.Second):
		fmt.Println("stop monitor")
	}
}

/*
设置一个监控goroutine，使用WithTimeout创建一个基于Background的ctx，其会当前时间的10s后取消。验证结果如下：
context deadline exceeded
10s，监控goroutine被取消了。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	now := time.Now()
	later, _ := time.ParseDuration("10s")
	fmt.Printf("later: %T, later: %v\n", later, later)

	ctx,cancel := context.WithDeadline(context.Background(), now.Add(later))
	defer cancel()
	go Monitor(ctx)
	time.Sleep(20 * time.Second)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
