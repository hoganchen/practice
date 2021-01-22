/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

/*
time包为我们提供了一个数据类型time.Time(作为值使用)以及显示和测量时间和日期的功能函数。

当前时间可以使用time.Now()获取,或者使用t.Day()、t.Minute()等等来获取时间的一部分;
你甚至可以自定义时间格式化字符串,例如:fmt.Printf("%02d.%02d.%4d\n", t.Day(), t.Month(), t.Year())将会输出21.07.2011。

Duration类型表示两个连续时刻所相差的纳秒数,类型为int64。Location类型映射某个时区的时间,UTC表示通用协调世界时间。

包中的一个预定义函数func(t Time) Format(layout string) string可以根据一个格式化字符串来将一个时间t转换为相应格式的字符串,
你可以使用一些预定义的格式,如:time.ANSIC或time.RFC822。

一般的格式化设计是通过对于一个标准时间的格式化描述来展现的,这听起来很奇怪,但看下面这个例子你就会一目了然:
fmt.Println(t.Format("02 Jan 2006 15:04"))

https://strconv.com/posts/time-fmt/
The reference time used in the layouts is the specific time:
Mon Jan 2 15:04:05 MST 2006
也就是说，这个时间按代表的部分拆开，其实可以理解为一个递增序列（01 02 03 04 05 06 07）
先感叹下语言设计者的用心：2006-01-02 15:04:05这个日期，不但挺好记的，而且用起来也比较方便。

如果你需要在应用程序在经过一定时间或周期执行某项任务(事件处理的特例),则可以使用time.Ticker或者time.After:
我们将会在第14.5节讨论这些有趣的事情。另外,time.Sleep(Duration d)可以实现对某个进程(实质上是goroutine)时长为d的暂停。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	fmt.Printf("start type: %[1]T, value: %[1]v\n", start)
	fmt.Printf("%02d.%02d.%4d\n", start.Day(), start.Month(), start.Year())

	fmt.Printf("start.UTC(): %v\n", start.UTC())

	week := 60 * 60 * 24 * 7 * 1e9
	// type Duration int64
	week_from_now := start.Add(time.Duration(week))
	fmt.Printf("week_from_now: %v\n", week_from_now)

	s := start.Format("2006.01.02 15:04:05")
	fmt.Println(start, "==>", s)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
