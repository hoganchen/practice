// ============================================================
// 知识点：时间操作（time 包）
//
// time 包提供时间处理、格式化、解析、定时器等功能。
// Go 使用独特的参考时间格式：Mon Jan 2 15:04:05 MST 2006
// 即：1(月) 2(日) 3(时) 4(分) 5(秒) 6(年)
// time.Ticker 和 time.Timer 实现定时操作。
// ============================================================

package main

import (
	"fmt"
	"time"
)

func main() {
	// ---- 1. 获取当前时间 ----
	fmt.Println("--- 当前时间 ---")

	now := time.Now()
	fmt.Printf("当前时间: %v\n", now)

	// 获取各分量
	fmt.Printf("年: %d, 月: %s, 日: %d\n", now.Year(), now.Month(), now.Day())
	fmt.Printf("时: %d, 分: %d, 秒: %d\n", now.Hour(), now.Minute(), now.Second())
	fmt.Printf("星期: %s\n", now.Weekday())
	fmt.Printf("一年中的第几天: %d\n", now.YearDay())
	fmt.Printf("时区: %s\n", now.Location())
	fmt.Printf("Unix 时间戳: %d\n", now.Unix())
	fmt.Printf("UnixNano: %d\n", now.UnixNano())

	// ---- 2. 时间格式化 ----
	fmt.Println("\n--- 时间格式化 ---")
	// Go 的参考时间：2006-01-02 15:04:05

	fmt.Println("默认格式:", now.Format(time.RFC3339))
	fmt.Println("自定义:", now.Format("2006-01-02 15:04:05"))
	fmt.Println("日期:", now.Format("2006/01/02"))
	fmt.Println("时间:", now.Format("15:04:05"))
	fmt.Println("中文:", now.Format("2006年01月02日 15:04:05"))
	fmt.Println("ISO8601:", now.Format(time.RFC3339Nano))

	// ---- 3. 解析时间字符串 ----
	fmt.Println("\n--- 时间解析 ---")

	layout := "2006-01-02 15:04:05"
	str := "2024-06-15 10:30:00"

	parsed, err := time.Parse(layout, str)
	if err != nil {
		fmt.Println("解析失败:", err)
	} else {
		fmt.Printf("解析结果: %v\n", parsed)
	}

	// 带时区的解析
	strTZ := "2024-06-15T10:30:00+08:00"
	parsedTZ, _ := time.Parse(time.RFC3339, strTZ)
	fmt.Printf("带时区解析: %v\n", parsedTZ)

	// ---- 4. 时间计算 ----
	fmt.Println("\n--- 时间计算 ---")

	// Duration 是纳秒级的时间间隔
	oneHour := time.Hour
	oneDay := 24 * oneHour
	fmt.Printf("1 小时 = %v\n", oneHour)
	fmt.Printf("1 天 = %v\n", oneDay)

	// 加减时间
	tomorrow := now.Add(oneDay)
	yesterday := now.Add(-oneDay)
	fmt.Printf("明天: %v\n", tomorrow.Format("2006-01-02"))
	fmt.Printf("昨天: %v\n", yesterday.Format("2006-01-02"))

	// 时间差
	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	elapsed := time.Since(start)  // 等价于 time.Now().Sub(start)
	fmt.Printf("从 %v 到现在经过: %v\n", start.Format("2006-01-02"), elapsed)

	// 精确的时间差计算
	t1 := time.Now()
	time.Sleep(100 * time.Millisecond) // 模拟工作
	t2 := time.Now()
	diff := t2.Sub(t1)
	fmt.Printf("耗时: %v（%.2f ms）\n", diff, diff.Seconds()*1000)

	// ---- 5. time.After（超时控制）----
	fmt.Println("\n--- time.After ---")
	// time.After 返回 channel，在指定时间后接收到值

	select {
	case <-time.After(2 * time.Second):
		fmt.Println("2 秒后执行")
		// 实际使用：作为超时控制
	}
	fmt.Println("（2 秒等待完成）")

	// ---- 6. time.Ticker（定时器）----
	fmt.Println("\n--- Ticker 定时器 ---")

	fmt.Println("每 200ms 触发一次:")
	ticker := time.NewTicker(200 * time.Millisecond)
	done := make(chan bool)

	go func() {
		time.Sleep(1 * time.Second)
		done <- true
	}()

	// 接收 3 次 ticker 信号
	for i := 0; i < 3; i++ {
		select {
		case t := <-ticker.C:
			fmt.Printf("  TICK 于 %s\n", t.Format("15:04:05.000"))
		case <-done:
			fmt.Println("  完成")
		}
	}
	ticker.Stop() // 停止 ticker
	fmt.Println("  Ticker 已停止")

	// ---- 7. time.Timer（一次定时器）----
	fmt.Println("\n--- Timer（一次性）---")

	timer := time.NewTimer(500 * time.Millisecond)
	<-timer.C
	fmt.Println("  500ms 后定时器触发")

	// Timer 也可以重置和停止
	timer2 := time.NewTimer(1 * time.Second)
	timer2.Stop() // 提前停止

	// ---- 8. 睡眠 ----
	fmt.Println("\n--- 睡眠 ---")

	fmt.Print("  睡 200ms...")
	time.Sleep(200 * time.Millisecond)
	fmt.Println(" 醒了!")

	// ---- 9. 时区 ----
	fmt.Println("\n--- 时区 ---")

	loc, _ := time.LoadLocation("America/New_York")
	nyTime := now.In(loc)
	fmt.Printf("纽约时间: %s\n", nyTime.Format("2006-01-02 15:04:05 MST"))
	fmt.Printf("当前时区: %s\n", now.Location())

	// ---- 10. 比较时间 ----
	fmt.Println("\n--- 时间比较 ---")

	tA := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	tB := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)

	fmt.Printf("tA.Before(tB): %t\n", tA.Before(tB)) // true
	fmt.Printf("tA.Equal(tB): %t\n", tA.Equal(tB))   // false
	fmt.Printf("tA.After(tB): %t\n", tA.After(tB))   // false
}

// 编译运行：go run 01_time.go
