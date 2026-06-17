// ============================================================================
// 知识点: time 包 - 时间处理
//
// 说明:
// - time 包提供时间的获取、格式化、计算等功能
// - Go的时间格式化使用"魔数" 2006-01-02 15:04:05 (1月2日15点04分05秒)
// - time.Duration 表示时间间隔, 单位是纳秒
// - time.Ticker 和 time.Timer 用于定时操作
// - 时区处理使用 time.LoadLocation
//
// 编译和运行:
//   go run 12_time\01_time_usage.go
// ============================================================================

package main

import (
	"fmt"
	"time"
)

func main() {
	now := time.Now()
	fmt.Println("当前时间:", now)

	// 格式化 (Go的格式模板是固定的 2006-01-02 15:04:05)
	fmt.Println("格式化:", now.Format("2006-01-02 15:04:05"))
	fmt.Println("日期:", now.Format("2006/01/02"))
	fmt.Println("时间:", now.Format("15:04:05"))

	// 时间计算
	tomorrow := now.Add(24 * time.Hour)
	fmt.Println("明天:", tomorrow.Format("2006-01-02"))

	diff := tomorrow.Sub(now)
	fmt.Println("时间差(小时):", diff.Hours())

	// 创建指定时间
	t := time.Date(2025, time.March, 15, 10, 30, 0, 0, time.Local)
	fmt.Println("指定时间:", t.Format("2006-01-02 15:04:05"))

	// 定时器 (演示非阻塞)
	timer := time.NewTimer(10 * time.Millisecond)
	<-timer.C
	fmt.Println("定时器触发")

	// 时区转换
	utc := now.UTC()
	fmt.Println("UTC时间:", utc.Format("15:04:05"))

	loc, _ := time.LoadLocation("America/New_York")
	ny := now.In(loc)
	fmt.Println("纽约时间:", ny.Format("15:04:05"))
}
