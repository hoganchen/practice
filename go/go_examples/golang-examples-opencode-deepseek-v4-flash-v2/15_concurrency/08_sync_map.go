// ============================================================================
// 知识点: sync.Map 并发安全映射
//
// 说明:
// - sync.Map 是并发安全的 map, 无需额外加锁
// - 适合: 读多写少、key 只写一次多次读取的场景
// - Load / Store / Delete / LoadOrStore / Range
// - 普通 map + RWMutex 读多写少时性能可能更好
// - 适合在热点代码中做缓存
//
// 编译和运行:
//   go run 15_concurrency\08_sync_map.go
// ============================================================================

package main

import (
	"fmt"
	"sync"
)

func main() {
	var sm sync.Map
	var wg sync.WaitGroup

	// 并发写入
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			sm.Store(fmt.Sprintf("key%d", n), n*100)
		}(i)
	}
	wg.Wait()
	fmt.Println("sync.Map 写入完成")

	// 并发读取
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			if val, ok := sm.Load(fmt.Sprintf("key%d", n)); ok {
				fmt.Printf("  key%d = %d\n", n, val)
			}
		}(i)
	}
	wg.Wait()

	// LoadOrStore: 存在则返回, 不存在则写入
	actual, loaded := sm.LoadOrStore("key0", 999)
	fmt.Printf("LoadOrStore key0: actual=%d, loaded=%t\n", actual, loaded)

	actual, loaded = sm.LoadOrStore("newkey", 777)
	fmt.Printf("LoadOrStore newkey: actual=%d, loaded=%t\n", actual, loaded)

	// Delete
	sm.Delete("key1")
	if _, ok := sm.Load("key1"); !ok {
		fmt.Println("key1 已删除")
	}

	// Range 遍历
	fmt.Println("\n遍历 sync.Map:")
	sm.Range(func(key, value any) bool {
		fmt.Printf("  %s = %d\n", key, value)
		return true
	})
}
