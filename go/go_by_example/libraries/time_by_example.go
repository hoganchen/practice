package main

import (
	"fmt"
	"time"
)

// Go 为时间（time）和时间段（duration）提供了大量的支持；这儿有是一些例子。
func main() {
	p := fmt.Println

	// 从获取当前时间时间开始。
	now := time.Now()
	p(now)
	fmt.Println("\n############################################################\n")

	// 字符串转日期
	t, _ := time.Parse("2006-01-02 15:04:05", "2025-05-15 23:34:45")
	p(t)
	tt, _ := time.Parse("20060102", "20250515")
	p(tt)
	fmt.Println("\n############################################################\n")

	// 日期转字符串
	p(now.Format("2006-01-02 15:04:05"))           // 输出：2025-05-15 14:30:00
	p(now.Format("2006/01/02 15:04"))              // 输出：2025/05/15 14:30
	p(now.Format("2006年01月02日 15时04分05秒"))         // 2025年05月15日 14时30分45秒
	p(now.Format("Mon, 02 Jan 2006 15:04:05 MST")) // Thu, 15 May 2025 14:30:45 CST

	// 内置了多种标准格式常量
	p(now.Format(time.RFC3339))  // 2025-05-15T14:30:45+08:00
	p(now.Format(time.RFC1123Z)) // Thu, 15 May 2025 14:30:45 +0800
	p(now.Format(time.Kitchen))  // 2:30PM
	fmt.Println("\n############################################################\n")

	// 时间戳 → 日期
	// 使用 time.Unix()，参数为秒和纳秒
	timestamp := int64(1747384245)
	t = time.Unix(timestamp, 0) // 输出：2025-05-15 14:30:45 +0800 CST
	p(t)

	// 日期 → 时间戳
	// 通过 Unix() 或 UnixMilli() 获取时间戳
	t = time.Now()
	unixSec := t.Unix()               // 秒级时间戳
	unixMilli := t.UnixMilli()        // 毫秒级时间戳
	unixNano := time.Now().UnixNano() // 纳秒级时间戳
	p(unixSec)
	p(unixMilli)
	p(unixNano)
	fmt.Println("\n############################################################\n")

	// 通过提供年月日等信息，你可以构建一个 time。 时间总是与 Location 有关，也就是时区。
	then := time.Date(
		2009, 11, 17, 20, 34, 58, 651387237, time.UTC)
	p(then)

	p(then.Year())
	p(then.Month())
	p(then.Day())
	p(then.Hour())
	p(then.Minute())
	p(then.Second())
	p(then.Nanosecond())
	p(then.Location())

	p(then.Weekday())

	p(then.Before(now))
	p(then.After(now))
	p(then.Equal(now))

	diff := now.Sub(then)
	p(diff)

	p(diff.Hours())
	p(diff.Minutes())
	p(diff.Seconds())
	p(diff.Nanoseconds())

	p(then.Add(diff))
	p(then.Add(-diff))
}
