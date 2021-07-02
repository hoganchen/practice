/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"runtime"
)

/*
https://capops.xyz/post/golang%E8%B0%83%E5%BA%A6%E5%99%A8%E7%9A%84%E4%B8%80%E4%B8%AA%E9%99%B7%E9%98%B1/

$ GOMAXPROCS=8 go run x.go

(旁注：熟悉Golang的同道想必知道GOMAXPROCS其实对应的CPU核心数，也就是线程数，这里应该是原作者运行示例时的计算机的CPU核数为8，因为根据文档定义，如果runtime.GOMAXPROCS(0)传入参数小于1，如果特殊指定，GOMAXPROCS就等于CPU核心数)

你观察到程序从未终止吗？这就是我说的golang陷阱。如果你用C/C++写同样的程序，你就不会发现这样的问题。现在让我们修改程序，修改以下一行：

threads := runtime.GOMAXPROCS(0)-1

所以，我们只是减少了1个go协程的数量。如果你在这个改变后重新运行程序，你会发现程序正确地终止，并打印出结果。这非常令人惊讶，不是吗？要了解这个问题背后的原因，我们需要了解一下golang运行时和调度器的实现。

Golang实现了一个可协作的抢占式调度器。它没有实现基于定时器中断的抢占。但是，这个调度器应该方便在一个OS线程上同时运行多个goroutine。Golang在运行时提供的构造体、库和系统调用(？此处翻译的不好，构造体这个说法听着怪怪的)中加入钩子，可以与调度器进行协作。由于它避开了调用进入调度器的计时器，所以将运行时提供的函数作为进入调度器的入口。如果我们设法写一个不使用任何运行时提供的封装函数的goroutine，会发生什么？这正是这里发生的事情。那个goroutine不会调用到调度器，并导致goroutine的抢占。

在上面的程序中，我们执行的goroutine等于GOMAXPROCS（操作系统线程）。主协程是一个额外的goroutine。每个go协程都运行一个无限循环，并带有一个整数增量操作，这为协程提供了没有调用到调度器的范围。因此，所有六个线程（GOMAXPROCS）都在运行无限循环，它们永远不会抢占。处于可运行状态的主协程无法执行，因为这六个线程中的任何一个线程都忙于执行无限循环，所以调度器永远不会被执行。当我们减少1个线程时，现在有一个OS线程变得空闲，能够执行主程序。

(旁注：假设系统是8个CPU，我们GOMAXPROCS减1以后运行程序，就会有一个核是空闲的，此时正好可以进入主线程中执行，虽然原作者这里写的是6，不过我觉得处于无限循环的线程应该等同于threads，当threads等于系统CPU核心数时，由于无限循环，主协程没有机会被调度到，所以就程序没法退出，当将threads头1时，主协程才有机会能够执行，GOMAXPROCS限制的是goroutine的最大并发能力，这个也是由golang自己的调度器实现的，那主协程能运行是由于golang调度所致吗？此处先埋下伏笔。 我分别在不同的go版本下运行了示例程序：1.13、1.14，得到了不同的结果，1.13符合预期，但是1.14下程序却有不同表现，主线程总能得到执行，我想这应该是因为1.14版本的go调度器有较大变化所致，此处先埋点，后开坑)

在现实世界的程序中，这种情况是不太可能发生的，因为我们可能会使用运行时提供的功能，如channels、systemcalls、fmt.Sprint、Mutex、time.Sleep至少一次。你可以在无限循环中添加一个无害的time.Sleep(0)，然后观察程序不再挂起。

这个问题应该出现在g 1.13及以前的版本，go 1.14加入了基于信号的抢占式调度，不会出现该情况了。

sysmon

sysmon是一个由runtime启动的M，也叫监控线程，它无需P也可以运行，它每20us~10ms唤醒一次，主要执行:

    释放闲置超过5分钟的span物理内存；
    如果超过2分钟没有垃圾回收，强制执行；
    将长时间未处理的netpoll结果添加到任务队列；
    向长时间运行的G任务发出抢占调度；
    收回因syscall长时间阻塞的P；

入口在src/runtime/proc.go:sysmon函数，它通过retake实现对syscall和长时间运行的G进行调度
*/
func goScheduler() {
	var x int
	threads := runtime.GOMAXPROCS(0)
	println(threads)
	for i := 0; i < threads; i++ {
		go func() {
			for {
				x++
				// time.Sleep(0)
			}
		}()
	}
	time.Sleep(time.Second)
	fmt.Println("x =", x)
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	goScheduler()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
