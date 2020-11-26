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

    a := make([]int, num, num)

    var wg sync.WaitGroup
    wg.Add(num)

    for i := 0; i < num; i++ {
        k := i // 必须使用局部变量
        go func(idx int) {
            a[idx] = 1
            wg.Done()
        }(k)
    }

    wg.Wait()

    count := 0
    for i := range a {
        if a[i] != 0 {
            count++
        }
	}

    fmt.Println(count)
}

/*
使用索引
优点：无锁，不影响性能
https://www.cnblogs.com/zcqkk/p/11772173.html
*/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	test()

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
