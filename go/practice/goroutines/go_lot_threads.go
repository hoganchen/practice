/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"net"
	"sync"
	"runtime/pprof"
)

var threadProfile = pprof.Lookup("threadcreate")

/*
Go提供了两种查询域名的方式，CGO方式或者纯Go方式，比如net库中的Dial、LookupHost、LookupAddr这些函数都会间接或者直接的与域名程序相关，
比如上面的例子中使用LookupHost，采用不同的方式并发情况下产生的线程会不同。

比如采用纯Go的方式,程序在退出的时候会有10个线程：
GODEBUG=netdns=go go run go_lot_threads.go
Program start execution at 2020-12-29 14:58:03

threads in starting: 6
threads after LookupHost: 11

Program end execution at 2020-12-29 14:58:34
Total elapsed time: 30.281793577s


而采用cgo的方式，程序在退出的时候会有几十个甚至上百线程：
GODEBUG=netdns=cgo go run go_lot_threads.go
Program start execution at 2020-12-29 14:59:34

threads in starting: 6
threads after LookupHost: 106

Program end execution at 2020-12-29 15:00:14
Total elapsed time: 39.490862263s

// https://colobu.com/2020/12/20/threads-in-go-runtime/
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	// 开始前的线程数
	fmt.Printf(("threads in starting: %d\n"), threadProfile.Count())
	var wg sync.WaitGroup
	wg.Add(100)
	for i := 0; i < 100; i++ {
		go func() {
			defer wg.Done()
			for j := 0; j < 100; j++ {
				net.LookupHost("www.google.com")
			}
		}()
	}
	wg.Wait()
	// goroutine执行完后的线程数
	fmt.Printf(("threads after LookupHost: %d\n"), threadProfile.Count())

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
