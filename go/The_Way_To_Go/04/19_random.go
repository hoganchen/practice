/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"math/rand"
)

/*
函数rand.Float32和rand.Float64返回介于[0.0, 1.0)之间的伪随机数,其中包括0.0但不包括1.0。
函数rand.Intn返回介于[0, n)之间的伪随机数。

你可以使用Seed(value)函数来提供伪随机数的生成种子,一般情况下都会使用当前时间的纳秒级数字
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	for i := 0;i < 10; i++ {
		a := rand.Int()
		fmt.Printf("%d / ", a)
	}

	fmt.Println()

	for i := 0;i < 10; i++ {
		a := rand.Intn(10)
		fmt.Printf("%d / ", a)
	}

	fmt.Println()

	timens := int64(time.Now().Nanosecond())
	fmt.Printf("timens = %v\n", timens)
	rand.Seed(timens)

	for i := 0; i < 10; i++ {
		fmt.Printf("%2.2f / ", 100 * rand.Float32())
	}

	fmt.Println()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
