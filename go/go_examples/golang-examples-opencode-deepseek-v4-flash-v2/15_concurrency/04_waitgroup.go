// ============================================================================
// 知识点: sync.WaitGroup 等待组
//
// 说明:
// - WaitGroup 用于等待一组 goroutine 完成
// - Add(delta): 增加计数器
// - Done(): 减少计数器 (通常在 defer 中调用)
// - Wait(): 阻塞直到计数器为零
// - Add 必须在 goroutine 启动前调用, Done 在 goroutine 内部调用
//
// 编译和运行:
//   go run 15_concurrency\04_waitgroup.go
// ============================================================================

package main

import (
	"fmt"
	"sync"
	"time"
)

func fetchAPI(url string, wg *sync.WaitGroup) {
	defer wg.Done()
	// 模拟 API 调用
	time.Sleep(time.Duration(100+url[0]) * time.Millisecond)
	fmt.Printf("完成请求: %s\n", url)
}

func main() {
	var wg sync.WaitGroup

	urls := []string{
		"https://api.example.com/users",
		"https://api.example.com/posts",
		"https://api.example.com/comments",
		"https://api.example.com/tags",
	}

	start := time.Now()

	for _, url := range urls {
		wg.Add(1)
		go fetchAPI(url, &wg)
	}

	fmt.Println("等待所有请求完成...")
	wg.Wait()
	fmt.Printf("所有请求完成! 耗时: %v\n", time.Since(start))
}
