package main

import (
	"fmt"
	"time"
)

// 一般程序会有获取 Unix 时间 的秒数，毫秒数，或者微秒数的需求。来看看如何用 Go 来实现。
func main() {

	// 分别使用 time.Now 的 Unix 和 UnixNano， 来获取从 Unix 纪元起，到现在经过的秒数和纳秒数。
	now := time.Now()
	secs := now.Unix()
	nanos := now.UnixNano()
	fmt.Println(now)

	// 注意 UnixMillis 是不存在的，所以要得到毫秒数的话， 你需要手动的从纳秒转化一下。
	// go 1.20版本已支持UnixMilli和UnixMicro
	millis := nanos / 1000000
	fmt.Println("秒:", secs)             // 秒
	fmt.Println("毫秒:", millis)          // 毫秒
	fmt.Println("毫秒:", now.UnixMilli()) // 毫秒
	fmt.Println("微秒:", now.UnixMicro()) // 微秒
	fmt.Println("纳秒:", nanos)           // 纳秒

	fmt.Println(time.Unix(secs, 0))
	fmt.Println(time.Unix(0, nanos))
}
