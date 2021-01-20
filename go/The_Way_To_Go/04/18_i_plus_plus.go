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
你可以将语句b = b + a简写为b+=a,同样的写法也可用于-=、*=、/=、%=。
对于整数和浮点数,你可以使用一元运算符++(递增)和--(递减),但只能用于后缀

同时,带有++和--的只能作为语句,而非表达式,因此n=i++这种写法是无效的,其它像f(i++)或者a[i]=b[i++]这些可以用于C、C++和Java中的写法在Go中也是不允许的。

在运算时溢出不会产生错误,Go会简单地将超出位数抛弃。如果你需要范围无限大的整数或者有理数(意味着只被限制于计算机内存),
你可以使用标准库中的big包,该包提供了类似big.Int和big.Rat这样的类型
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var i = 0
	i++
	fmt.Printf("i = %v\n", i)
	i--
	fmt.Printf("i = %v\n", i)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
