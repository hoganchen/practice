/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"net"
	"time"
	"sync"
	"runtime/pprof"
)

var threadProfile = pprof.Lookup("threadcreate")

func goroutine_thread() {
	// 开始前的线程数
	fmt.Printf(("threads in starting: %d\n"), threadProfile.Count())
	var wg sync.WaitGroup
	wg.Add(100)
	for i := 0; i < 100; i++ {
		go func() {
			defer wg.Done()
			for j := 0; j < 100; j++ {
				net.LookupHost("www.baidu.com")
			}
		}()
	}
	wg.Wait()
	// goroutine执行完后的线程数
	fmt.Printf(("threads after LookupHost: %d\n"), threadProfile.Count())
}

/*
https://colobu.com/2020/12/20/threads-in-go-runtime/

稍微入门Go语言的程序员都知道，GOMAXPROCS变量可以限制并发运行用户态Go代码操作系统的最大线程数，
你甚至可以通过调用函数func GOMAXPROCS(n int) int在程序运行时改变最大线程数的大小，但是当你进一步阅读文档，
或者更深入的应用Go语言开发的时候，你就会发现，实际线程数要比你设置的这个数要大，有时候甚至远远大于你设置的数值，
更悲剧的是，即使你的并发任务回退到没有几个的时候，这些线程数还没有降下来，白白浪费内存空间和CPU的调度。

阻塞的系统调用就是系统调用执行时，在完成之前调用者必须等待。read()就是一个很好的例子，如果没有数据可读，
调用者就一直等待直到一些数据可读(在你没有将它设置为 non-blocking情况下)。

那么如此一来Go从网络I/O中read数据岂不是每个读取goroutine都会占用一个系统线程了么？不会的!Go使用netpoller处理网络读写，
它使用epoll(linux)、kqueue(BSD、Darwin)、IoCompletionPort(Windows)的方式可以poll network I/O的状态。
一旦接受了一个连接，连接的文件描述符就被设置为non-blocking，这也意味着一旦连接中没有数据，从其中read数据并不会被阻塞，
而是返回一个特定的错误，因此Go标准库的网络读写不会产生大量的线程，除非你把GOMAXPROCS设置的非常大，
或者把底层的网络连接文件描述符又设置回了blocking模式。

但是cgo或者其它一些阻塞的系统调用可能就会导致线程大量增加并无法回收了，比如下面的例子。

Go提供了两种查询域名的方式，CGO方式或者纯Go方式，比如net库中的Dial、LookupHost、
LookupAddr这些函数都会间接或者直接的与域名程序相关，比如上面的例子中使用LookupHost，采用不同的方式并发情况下产生的线程会不同。

比如采用纯Go的方式,程序在退出的时候会有10个线程：
$ GODEBUG=netdns=go go run goroutine_thread_num.go
threads in starting: 7
threads after LookupHost: 10

而采用cgo的方式，程序在退出的时候会有几十个甚至上百线程：
$ GODEBUG=netdns=cgo go run goroutine_thread_num.go
threads in starting: 7
threads after LookupHost: 109
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	goroutine_thread()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
