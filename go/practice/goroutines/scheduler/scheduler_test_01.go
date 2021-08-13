/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"unsafe"
	"runtime"
)

// https://mp.weixin.qq.com/s/WWfm7Ui7g_gGlb8XkIZigg
func scheduler_test_01() {
    runtime.GOMAXPROCS(10)
    var ch = make(chan int)

	for i := 0; i < 10; i++ {
		// fmt.Printf("Before assignment, the pointer address: %v\n", unsafe.Pointer(&i))
		/*
		这句语句会重新分配内存，用于存放i，所以每个goroutine中的i地址不同，打印结果也不同
		如果注释掉这条语句，则goroutine打印的i值依赖于goroutine执行时循环变量i的值
		*/
        i := i
		// fmt.Printf("After assignment, the pointer address: %v\n", unsafe.Pointer(&i))
        go func(ch chan int) {
			fmt.Printf("In goroutine, the pointer address: %v\n", unsafe.Pointer(&i))
            fmt.Println(i)
			// ch <- i
        }(ch)
    }

	/*
	下面是goroutine可能会阻塞的情况：

    在channel上发送和接收
    网络I/O操作
    阻塞的系统调用
    使用定时器
    使用互斥锁

	由于代码只设置了一个P，所以在main goroutine在没有读channel的时候，不会发生调度去执行新建的goroutine，
	而新建的goroutine先被放入runnext中，由于没有得到P，所以被阻塞，然后下一个新建的goroutine会先放入到runnext中，
	前一个goroutine会被已送到local queue中，当最后一个goroutine被阻塞，这时main goroutine发生了读channel操作，
	开始调度执行新建的goroutine，所以这时最后一个goroutine被调度执行，然后开始执行local queue中的goroutine，
	所以打印结果为9， 0， 1， 2， 3， 4， 5， 6， 7， 8

	如果把读写channel改为sleep，则打印结果为0, 1, 2, 3, 4, 5, 6, 7, 8, 9，待分析原因(todo)
	*/
	for i := 0; i < 10; i++ {
		<- ch
	}
	// time.Sleep(100 * time.Millisecond)
}

func scheduler_test_02() {
    runtime.GOMAXPROCS(10)
    var ch = make(chan int)

	for i := 0; i < 10; i++ {
		// fmt.Printf("Before assignment, the pointer address: %v\n", unsafe.Pointer(&i))
		/*
		这句语句会重新分配内存，用于存放i，所以每个goroutine中的i地址不同，打印结果也不同
		如果注释掉这条语句，则goroutine打印的i值依赖于goroutine执行时循环变量i的值
		*/
        i := i
		// fmt.Printf("After assignment, the pointer address: %v\n", unsafe.Pointer(&i))
        go func(ch chan int) {
			fmt.Printf("In goroutine, the pointer address: %v\n", unsafe.Pointer(&i))
            fmt.Println(i)
			// ch <- i
        }(ch)
    }

	/*
	如果把读写channel改为sleep，则打印结果为0, 1, 2, 3, 4, 5, 6, 7, 8, 9，待分析原因(todo)

	可以看到，用 go1.14 及之后的版本运行时，输出顺序和之前的一致。而用 go1.13 运行时，却先输出了 0，这又是什么原因呢？

	这就要从 Go 1.14 修改了 timer 的实现开始说起了。

	go 1.13 的 time 包会生产一个名字叫 timerproc 的 goroutine 出来，
	它专门用于唤醒挂在 timer 上的时间未到期的 goroutine；因此这个 goroutine 会把 runnext 上的 goroutine 挤出去。
	因此输出顺序就是：0, 1, 2, 3, 4, 5, 6, 7, 8, 9。

	而 go 1.14 把这个唤醒的 goroutine 干掉了，取而代之的是，在调度循环的各个地方、sysmon 里都是唤醒 timer 的代码，
	timer 的唤醒更及时了，但代码也更难看懂了。所以，输出顺序和第一个例子是一致的。
	*/
	// for i := 0; i < 10; i++ {
	// 	<- ch
	// }
	time.Sleep(100 * time.Millisecond)
}

/*
https://wudaijun.com/2018/01/go-scheduler/
G创建流程

G结构体会复用，对可复用的G管理类似于待运行的G管理，也有Local队列(p.gfree)和Global队列(sched.gfree)之分，
获取算法差不多，优先从p.gfree中获取(无锁操作)，否则从sched.gfree中获取并批量转移一部分(有锁操作)，
源代码参考src/runtime/proc.go:gfget函数。

从Goroutine的角度来看，通过go func()创建时，会从当前闲置的G队列取得可复用的G，如果没有则通过malg新建一个G，然后:

    1. 尝试将G添加到当前P的runnext中，作为下一个执行的G
    2. 否则放到Local队列runq中(无锁)
    3. 如果以上操作都失败，则添加到Global队列sched.runq中(有锁操作，因此也会顺便将当P.runq中一半的G转移到sched.runq)
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	scheduler_test_01()
	scheduler_test_02()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
