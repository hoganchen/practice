/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"sync"
	"time"
)

func test() {
	num := 10000

    var a []int
    var l sync.Mutex

    var wg sync.WaitGroup
    wg.Add(num)

    for i := 0; i < num; i++ {
        go func() {
            l.Lock() // 加锁
            a = append(a, 1)
            l.Unlock() // 解锁
            wg.Done()
        }()
    }

    wg.Wait()

    fmt.Println(len(a))
}

/*
对slice加锁，进行保护
缺点：锁会影响性能
https://www.cnblogs.com/zcqkk/p/11772173.html
*/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	test()

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
