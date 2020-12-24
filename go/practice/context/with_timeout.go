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
WithTimeout
此函数类似于 context.WithDeadline。不同之处在于它将持续时间作为参数输入而不是时间对象。此函数返回派生 context，如果调用取消函数或超出超时持续时间，则会取消该派生 context。
func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc) {
	return WithDeadline(parent, time.Now().Add(timeout))
}
观看源码我们可以看出WithTimeout内部调用的就是WithDeadline，其原理都是一样的，上面已经介绍过了，来看一个例子吧
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	ctx,cancel := context.WithTimeout(context.Background(), 10 * time.Second)
	defer cancel()
	go Monitor(ctx)
	time.Sleep(20 * time.Second)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
