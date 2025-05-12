package main

import "fmt"

func modifyMap(m map[int]string) {
	// 触发扩容的操作（如大量插入）
	for i := 0; i < 10000; i++ {
		m[i] = fmt.Sprintf("value%d", i)
	}
}

/*
map 的底层结构 hmap 包含指向哈希表（buckets）的指针。当 map 被传递到函数时，复制的仅是 hmap 结构体的副本，而其中的指针仍指向同一底层哈希表

函数内对键值对的修改（如 m[key] = value）会直接影响原始 map，因为共享同一底层哈希表

扩容时，hmap 中的 buckets 指针会指向新桶数组，而 oldbuckets 保留旧数据用于渐进式迁移。由于函数内外共享 hmap 结构体，新指针的更新会同步到原始 map
*/
func main() {
	originalMap := make(map[int]string)
	modifyMap(originalMap)
	fmt.Println(len(originalMap)) // 输出 1000，说明扩容后的修改影响了原始 map
}
