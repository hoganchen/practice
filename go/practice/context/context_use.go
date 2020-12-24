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

func HelloHandle(ctx context.Context, duration time.Duration) {
	select {
	case <- ctx.Done():
		fmt.Println(ctx.Err())
	case <- time.After(duration):
		fmt.Println("process request with", duration)
	}
}

/*
context.Context 是 Go 语言在 1.7 版本中引入标准库的接口1，该接口定义了四个需要实现的方法，其中包括：
 	Deadline — 返回 context.Context 被取消的时间，也就是完成工作的截止日期；
 	Done — 返回一个 Channel，这个 Channel 会在当前工作完成或者上下文被取消之后关闭，多次调用 Done 方法会返回同一个 Channel；
 	Err — 返回 context.Context 结束的原因，它只会在 Done 返回的 Channel 被关闭时才会返回非空的值；
 		如果 context.Context 被取消，会返回 Canceled 错误；
 		如果 context.Context 超时，会返回 DeadlineExceeded 错误；
 	Value — 从 context.Context 中获取键对应的值，对于同一个上下文来说，多次调用 Value 并传入相同的 Key 会返回相同的结果，该方法可以用来传递请求特定的数据；
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	ctx, cancel := context.WithTimeout(context.Background(), 2 * time.Second)
	defer cancel()
	go HelloHandle(ctx, 500 * time.Millisecond)

	select {
	case <- ctx.Done():
		fmt.Println("Hello Handle", ctx.Err())
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
