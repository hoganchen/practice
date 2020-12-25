/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"sync"
)

type s_total struct {
	sync.Mutex
	value int
}

var total s_total

/*
在worker的循环中,为了保证total.value += i的原子性,我们通过sync.Mutex加锁和解锁来保证该语句在同一时刻只被一个线程访问。
对于多线程模型的程序而言,进出临界区前后进行加锁和解锁都是必须的。如果没有锁的保护,total的最终值将由于多线程之间的竞争而可能会不正确。
用互斥锁来保护一个数值型的共享资源,麻烦且效率低下。
*/
func worker(wg *sync.WaitGroup) {
	defer wg.Done()

	for i := 0; i < 1000; i++ {
		total.Lock()
		total.value += 1
		total.Unlock()
	}
}

func hard_worker(tt *s_total, wg *sync.WaitGroup) {
	defer wg.Done()

	for i := 0; i < 1000; i++ {
		tt.Lock()
		tt.value += 1
		tt.Unlock()
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

	fmt.Printf("total.value: %v\n", total.value)

	var tt s_total
	wg.Add(2)

	go hard_worker(&tt, &wg)
	go hard_worker(&tt, &wg)
	wg.Wait()

	fmt.Printf("tt.value: %v\n", tt.value)


	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
