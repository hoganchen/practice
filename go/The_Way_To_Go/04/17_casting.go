/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"math"
)

func Uint8FromInt(n int) (uint8, error) {
	if 0 <= n && n <= math.MaxUint8 {
		return uint8(n), nil
	} else {
		return 0, fmt.Errorf("%d is out of uint8 range", n)
	}
}

func IntFromFloat64(x float64) int {
	if math.MinInt32 <= x && x <= math.MaxInt32 {
		whole, fraction := math.Modf(x)
		fmt.Printf("For %v, whole = %f, fraction = %v\n", x, whole, fraction)

		if fraction >= 0.5 {
			whole += 1
		}

		return int(whole)
	}

	panic(fmt.Sprintf("%g is out of int32 range", x))
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	fmt.Printf("IntFromFloat64 result: %v\n", IntFromFloat64(1234567890.987654321))

	fmt.Printf("math.MaxInt8 = %v\n", math.MaxInt8)
	fmt.Printf("math.MaxUint8 = %v\n", math.MaxUint8)
	fmt.Printf("math.MaxInt16 = %v\n", math.MaxInt16)
	fmt.Printf("math.MaxUint16 = %v\n", math.MaxUint16)
	fmt.Printf("math.MaxInt32 = %v\n", math.MaxInt32)
	fmt.Printf("math.MaxUint32 = %v\n", math.MaxUint32)
	fmt.Printf("math.MaxInt64 = %v\n", math.MaxInt64)
	/*
	https://www.coder.work/article/25725
	这里的问题是常量没有类型。该常数将根据其使用的上下文采用一种类型。在这种情况下，它被用作接口(interface){}，
	因此编译器无法知道您要使用哪种具体类型。对于整数常量，默认为int。由于常量溢出一个int，因此这是编译时错误。
	通过传递uint64(num)，您可以通知编译器您希望将该值视为uint64。
	*/
	// fmt.Printf("math.MaxUint64 = %v\n", math.MaxUint64) // constant 18446744073709551615 overflows int
	fmt.Printf("math.MaxUint64 = %v\n", uint64(math.MaxUint64))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
