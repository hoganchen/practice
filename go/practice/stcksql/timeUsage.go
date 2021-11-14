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
https://strconv.com/posts/time-fmt/

这段代码分别把时间指向了2006-01-02 03:04:05和2006-01-02 15:04:05，然后格式化。看看输出:

❯ go run simple.go
2006-01-02 03:04:05 +0000 UTC
2006-01-02 03:04:05
2006-01-02 03:04:05
2006-01-02 15:04:05 +0000 UTC
2006-01-02 03:04:05
2006-01-02 15:04:05

看到第二个例子了吧？这个是一个下午时间，但使用2006-01-02 03:04:05和2006-01-02 15:04:05格式化获得的时间是不一样的。所以可以看出一定要使用24小时制的时间。

注意：使用"2006-01-02 03:04:05"解析出来的是12小时制时间，使用"2006-01-02 15:04:05"解析出来的是24小时制时间
 */
func timeParse() {
	t, _ := time.Parse("2006-01-02 15:04:05", "2006-01-02 03:04:05")

	fmt.Println(t)
	fmt.Println(t.Format("2006-01-02 03:04:05"))
	fmt.Println(t.Format("2006-01-02 15:04:05"))

	t, _ = time.Parse("2006-01-02 15:04:05", "2006-01-02 15:04:05")

	fmt.Println(t)
	fmt.Println(t.Format("2006-01-02 03:04:05"))
	fmt.Println(t.Format("2006-01-02 15:04:05"))
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	timeParse()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
