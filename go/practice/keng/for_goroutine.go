package main

import "fmt"
import "time"
import "sync"

func main() {
    var funcs []func()
	wg := sync.WaitGroup{}

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			fmt.Print(i, " ")  // 可能打印任意值，不是 0,1,2,3,4
		}()
	}

	time.Sleep(2 * time.Second)
	// wg.Wait()
	fmt.Println()

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			fmt.Print(i, " ")  // 打印 0,1,2,3,4
		}(i)
	}

	// time.Sleep(2 * time.Second)
	wg.Wait()
	fmt.Println()

    // 启动 5 个 goroutine，每个都捕获循环变量 i
    for i := 0; i < 5; i++ {
		i := i
        funcs = append(funcs, func() {
            fmt.Print(i, " ")
        })
    }

    // 执行所有闭包
    for _, f := range funcs {
        f()
    }
	fmt.Println()
    // Go 1.21 及之前：输出 "5 5 5 5 5" ❌
    // Go 1.22 及之后：输出 "0 1 2 3 4" ✅
}
