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

    var wg sync.WaitGroup
    wg.Add(num)

    c := make(chan int)
    for i := 0; i < num; i++ {
        go func() {
            c <- 1 // channl是协程安全的
            wg.Done()
        }()
    }

    // 等待关闭channel
    go func() {
        wg.Wait()
        close(c)
    }()

    // 读取数据
    var a []int
    for i := range c {
        a = append(a, i)
    }

	fmt.Println(len(a))
}

/*
使用channel的传递数据
https://www.cnblogs.com/zcqkk/p/11772173.html
*/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	test()

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
