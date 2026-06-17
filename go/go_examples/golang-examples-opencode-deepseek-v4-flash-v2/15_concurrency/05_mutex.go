// ============================================================================
// 知识点: sync.Mutex 互斥锁
//
// 说明:
// - Mutex 用于保护共享资源的并发访问
// - Lock() 获取锁, Unlock() 释放锁
// - 必须成对使用, 推荐使用 defer 确保解锁
// - sync.RWMutex: 读写锁, 多读单写, 读不互斥
// - 锁的粒度不宜过大也不宜过小
//
// 编译和运行:
//   go run 15_concurrency\05_mutex.go
// ============================================================================

package main

import (
	"fmt"
	"sync"
)

type Counter struct {
	mu    sync.Mutex
	value int
}

func (c *Counter) Increment() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.value++
}

func (c *Counter) Value() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.value
}

// RWMutex 示例
type SafeCache struct {
	mu    sync.RWMutex
	items map[string]string
}

func (c *SafeCache) Get(key string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	val, ok := c.items[key]
	return val, ok
}

func (c *SafeCache) Set(key, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items[key] = value
}

func main() {
	var counter Counter
	var wg sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Increment()
		}()
	}

	wg.Wait()
	fmt.Println("计数器结果:", counter.Value())

	// RWMutex 演示
	cache := SafeCache{items: make(map[string]string)}
	cache.Set("key1", "value1")
	if val, ok := cache.Get("key1"); ok {
		fmt.Println("缓存获取:", val)
	}
}
