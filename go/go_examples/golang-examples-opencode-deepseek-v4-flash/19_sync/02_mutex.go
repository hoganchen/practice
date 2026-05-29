// ============================================================
// 知识点：sync.Mutex（互斥锁）
//
// Mutex 提供互斥锁，防止多个 goroutine 同时访问共享资源。
// 使用 Lock() 加锁，Unlock() 解锁。
// 推荐用 defer 确保解锁。
//
// 编译运行方法：
//   go run 02_mutex.go
// ============================================================

package main

import (
	"fmt"
	"sync"
)

// -------- 线程安全的计数器 --------
type SafeCounter struct {
	mu    sync.Mutex // 互斥锁
	value int        // 受保护的共享资源
}

func (c *SafeCounter) Increment() {
	c.mu.Lock()   // 加锁
	defer c.mu.Unlock() // 确保解锁

	c.value++ // 临界区
}

func (c *SafeCounter) Decrement() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.value--
}

func (c *SafeCounter) GetValue() int {
	c.mu.Lock()
	defer c.mu.Unlock()

	return c.value
}

func main() {
	fmt.Println("=== sync.Mutex 示例 ===")

	// 不使用锁的计数器（演示竞态条件）
	unsafeCounter := 0

	// 使用锁的安全计数器
	safeCounter := SafeCounter{}

	var wg sync.WaitGroup
	iterations := 1000

	// 启动多个 goroutine 并发操作
	for i := 0; i < iterations; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			// 安全的操作
			safeCounter.Increment()

			// 不安全的操作（竞态条件）
			unsafeCounter++
		}()
	}

	wg.Wait()

	fmt.Printf("期望值: %d\n", iterations)
	fmt.Printf("安全计数器（有锁）: %d\n", safeCounter.GetValue())
	fmt.Printf("不安全计数器（无锁）: %d (可能不等于期望值)\n", unsafeCounter)
}
