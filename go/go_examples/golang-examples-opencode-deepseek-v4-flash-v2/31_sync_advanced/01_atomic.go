// ============================================================================
// 知识点: sync/atomic 原子操作
//
// 说明:
// - atomic 包提供底层原子内存操作, 比 Mutex 性能更好
// - 适用于简单计数器和标志位
// - atomic.AddInt64 / atomic.LoadInt64 / atomic.StoreInt64
// - atomic.CompareAndSwap (CAS) 实现无锁操作
// - Go 1.19+ 提供了 atomic.Int64 / atomic.Bool 等更方便的类型
//
// 编译和运行:
//   go run 31_sync_advanced\01_atomic.go
// ============================================================================

package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

func main() {
	// atomic.Int64 (Go 1.19+)
	var counter atomic.Int64
	var wg sync.WaitGroup

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Add(1)
		}()
	}
	wg.Wait()
	fmt.Println("atomic 计数器:", counter.Load())

	// atomic.Bool
	var flag atomic.Bool
	flag.Store(true)
	fmt.Println("atomic bool:", flag.Load())
	fmt.Println("CAS 成功:", flag.CompareAndSwap(true, false))
	fmt.Println("CAS 后值:", flag.Load())

	// 无锁的线程安全计数器
	var value atomic.Int64
	var mu sync.Mutex
	var wg2 sync.WaitGroup

	// Mutex 方式
	for i := 0; i < 1000; i++ {
		wg2.Add(1)
		go func() {
			defer wg2.Done()
			mu.Lock()
			value.Add(1)
			mu.Unlock()
		}()
	}
	wg2.Wait()
	fmt.Println("最终值:", value.Load())
}
