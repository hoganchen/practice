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
与字符串相关的类型转换都是通过strconv包实现的。
该包包含了一些变量用于获取程序运行的操作系统平台下int类型所占的位数,如:strconv.IntSize。
任何类型T转换为字符串总是成功的。

针对从数字类型转换到字符串,Go提供了以下函数:
strconv.Itoa(i int) string 返回数i所表示的字符串类型的十进制数。
strconv.FormatFloat(f float64, fmt byte, prec int, bitSize int) string 将64位浮点型的数字转换为字符串,
其中fmt表示格式(其值可以是'b' 、 'e' 、 'f'或'g' ), prec表示精度, bitSize则使用32表示float32,用64表示float64。
将字符串转换为其它类型tp并不总是可能的,可能会在运行时抛出错误parsing "...": invalid argument。

针对从字符串类型转换为数字类型,Go提供了以下函数:
strconv.Atoi(s string) (i int, err error)将字符串转换为int型。
strconv.ParseFloat(s string, bitSize int) (f float64, err error)将字符串转换为float64型。

利用多返回值的特性,这些函数会返回2个值,第1个是转换后的结果(如果转换成功),第2个是可能出现的错误,
因此,我们一般使用以下形式来进行从字符串到其它类型的转换:
val, err = strconv.Atoi(s)
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var orig string = "666"
	var an int
	var newS string

	fmt.Printf("The size of ints is： %d\n", strconv.IntSize)
	an, _ = strconv.Atoi(orig)
	fmt.Printf("The integer is: %d\n", an)
	an = an + 5
	newS = strconv.Itoa(an)
	fmt.Printf("The new string is: %s\n", newS)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
