/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"strconv"
)

/*
利用多返回值的特性,这些函数会返回2个值,第1个是转换后的结果(如果转换成功),第2个是可能出现的错误,
因此,我们一般使用以下形式来进行从字符串到其它类型的转换:
val, err = strconv.Atoi(s)

由于本例的函数调用者属于main函数,所以程序会直接停止运行。
如果我们想要在错误发生的同时终止程序的运行,我们可以使用os包的Exit函数:
习惯用法
if err != nil {
	fmt.Printf("Program stopping with error %v", err)
	os.Exit(1)
}
(此处的退出代码1可以使用外部脚本获取到)
有时候,你会发现这种习惯用法被连续重复地使用在某代码中。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var orig string = "666"
	var an int
	var newS string

	fmt.Printf("The size of ints is： %d\n", strconv.IntSize)

	// 转换为16进制
	v, e := strconv.ParseInt(orig, 16, 0)
	if nil != e {
		fmt.Printf("orig %s is not an integer - exiting with error\n", orig)
		return
	} else {
		fmt.Printf("The integer is: %d\n", v)
	}

	// Atoi is shorthand for ParseInt(s, 10, 0).
	an, err := strconv.Atoi(orig)
	if nil != err {
		fmt.Printf("orig %s is not an integer - exiting with error\n", orig)
		return
	}

	fmt.Printf("The integer is: %d\n", an)
	an = an + 5
	newS = strconv.Itoa(an)
	fmt.Printf("The new string is: %s\n", newS)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
