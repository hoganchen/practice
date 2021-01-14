/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"sync"
	"math/rand"
)

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var wg sync.WaitGroup
	var arr [100]int

	for id := 0; id < len(arr); id++ {
		arr[id] = id
	}

	for id := 0; id < len(arr); id++ {
		fmt.Printf("arr[%v] = %v\n", id, arr[id])
	}

	for id := 0; id < 100; id++ {
		wg.Add(1)

		go func(i int, item *int, wgoup *sync.WaitGroup) {
			defer wgoup.Done()
			time.Sleep(time.Duration(rand.Intn(5)) * time.Second)
			fmt.Printf("goroutine id: %v\n", i)
			*item = 100 - i - 1
		}(id, &arr[id], &wg)
	}

	wg.Wait()

	for id := 0; id < len(arr); id++ {
		fmt.Printf("arr[%v] = %v\n", id, arr[id])
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
