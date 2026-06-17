// ============================================================================
// 知识点: sync.Pool 对象池
//
// 说明:
// - sync.Pool 用于缓存临时对象, 减少 GC 压力和内存分配
// - 适合存储"重"对象(如 bytes.Buffer), 频繁创建销毁的场景
// - Get 返回池中任意对象, 可能为 nil (需初始化)
// - Put 将对象放回池中
// - Pool 中的对象可能在任何时候被回收(GC时)
// - 不适用于需要持久化的连接池(应该用 channel 或第三方库)
//
// 编译和运行:
//   go run 31_sync_advanced\02_pool.go
// ============================================================================

package main

import (
	"bytes"
	"fmt"
	"sync"
)

var bufferPool = sync.Pool{
	New: func() any {
		return new(bytes.Buffer)
	},
}

func writeMessage(msg string) string {
	buf := bufferPool.Get().(*bytes.Buffer)
	defer bufferPool.Put(buf)

	buf.Reset()
	buf.WriteString("[消息] ")
	buf.WriteString(msg)
	return buf.String()
}

func main() {
	var wg sync.WaitGroup
	messages := []string{"Hello", "World", "Pool", "Example"}

	for _, msg := range messages {
		wg.Add(1)
		go func(m string) {
			defer wg.Done()
			result := writeMessage(m)
			fmt.Println(result)
		}(msg)
	}
	wg.Wait()
}
