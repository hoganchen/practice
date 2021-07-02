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
这个程序，无论是单核还是多核，都永远不会结束。为什么呢？

首先byte相当uint8，所以，for循环始终执行，就是相当于 for {}

现在，我们强制执行了runtime.Gosched()让这个程序停止下，换给其他的协程使用，然后执行runtime.GC()，垃圾回收，结束程序执行。

我们知道，golang垃圾回收三色标记法，需要stop the world，stop the world的前提是能够把当前的状态全部保存起来。
可是这个协程一直在M上运行，停不下来啊！

导致无法GC，卡住了。

如果我们把程序改成非内联的呢？
*/
func endlessLoop() {
	var i byte
	go func() {
		for i = 0; i <= 255; i++ {
			// time.Sleep(0)
		}
	}()

	runtime.Gosched()
	runtime.GC()
	fmt.Println("end")
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	endlessLoop()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
