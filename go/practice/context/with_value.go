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

type key string

func Get(ctx context.Context,k key) {
	if v, ok := ctx.Value(k).(string); ok {
		fmt.Println(v)
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

func WithCancel(parent Context) (ctx Context, cancel CancelFunc)
func WithDeadline(parent Context, deadline time.Time) (Context, CancelFunc)
func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc)
func WithValue(parent Context, key, val interface{}) Context
这四个With函数，接收的都有一个partent参数，就是父Context，我们要基于这个父Context创建出子Context的意思，这种方式可以理解为子Context对父Context的继承，也可以理解为基于父Context的衍生。
通过这些函数，就创建了一颗Context树，树的每个节点都可以有任意多个子节点，节点层级可以有任意多个。
WithCancel函数，传递一个父Context作为参数，返回子Context，以及一个取消函数用来取消Context。 WithDeadline函数，和WithCancel差不多，它会多传递一个截止时间参数，意味着到了这个时间点，会自动取消Context，当然我们也可以不等到这个时候，可以提前通过取消函数进行取消。
WithTimeout和WithDeadline基本上一样，这个表示是超时自动取消，是多少时间后自动取消Context的意思。
WithValue函数和取消Context无关，它是为了生成一个绑定了一个键值对数据的Context，这个绑定的数据可以通过Context.Value方法访问到，后面我们会专门讲。
大家可能留意到，前三个函数都返回一个取消函数CancelFunc，这是一个函数类型，它的定义非常简单。
type CancelFunc func()
这就是取消函数的类型，该函数可以取消一个Context，以及这个节点Context下所有的所有的Context，不管有多少层级。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	ctx := context.WithValue(context.Background(),key("asong"),"Golang梦工厂")
	Get(ctx, key("asong"))
	Get(ctx, key("song"))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
