/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"sync"
	"sync/atomic"
)

var total uint64

/*
atomic.AddUint64函数调用保证了total的读取、更新和保存是一个原子操作,因此在多线程中访问也是安全的。
原子操作配合互斥锁可以实现非常高效的单件模式。互斥锁的代价比普通整数的原子读写高很多,在性能敏感的地方可以增加一个数字型的标志位,
通过原子检测标志位状态降低互斥锁的使用次数来提高性能。
*/
func worker(wg *sync.WaitGroup) {
	defer wg.Done()

	for i := 0; i < 1000; i ++ {
		atomic.AddUint64(&total, uint64(1))
	}
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var wg sync.WaitGroup
	wg.Add(2)

	go worker(&wg)
	go worker(&wg)
	wg.Wait()

	fmt.Printf("total: %v\n", total)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
