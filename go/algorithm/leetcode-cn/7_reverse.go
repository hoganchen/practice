/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"strings"
	"strconv"
)

func isPalindrome(x int) bool {
    // 特殊情况：
    // 如上所述，当 x < 0 时，x 不是回文数。
    // 同样地，如果数字的最后一位是 0，为了使该数字为回文，
    // 则其第一位数字也应该是 0
    // 只有 0 满足这一属性
    if x < 0 || (x % 10 == 0 && x != 0) {
        return false
    }

    revertedNumber := 0
	// 只计算了一半的数字
    for x > revertedNumber {
        revertedNumber = revertedNumber * 10 + x % 10
        x /= 10
    }

	fmt.Printf("x = %v, revertedNumber: %v\n", x, revertedNumber)

    // 当数字长度为奇数时，我们可以通过 revertedNumber/10 去除处于中位的数字。
    // 例如，当输入为 12321 时，在 while 循环的末尾我们可以得到 x = 12，revertedNumber = 123，
    // 由于处于中位的数字不影响回文（它总是与自己相等），所以我们可以简单地将其去除。
    return x == revertedNumber || x == revertedNumber / 10
}

func isPalindromeUseString(x int) bool {
    // 特殊情况：
    // 如上所述，当 x < 0 时，x 不是回文数。
    // 同样地，如果数字的最后一位是 0，为了使该数字为回文，
    // 则其第一位数字也应该是 0
    // 只有 0 满足这一属性
    if x < 0 || (x % 10 == 0 && x != 0) {
        return false
    }

	origString := strconv.Itoa(x)

	/*
	Go语言的字符有以下两种：

    一种是 uint8 类型，或者叫 byte 型，代表了 ASCII 码的一个字符。
    另一种是 rune 类型，代表一个 UTF-8 字符，当需要处理中文、日文或者其他复合字符时，则需要用到 rune 类型。rune 类型等价于 int32 类型。

	byte 类型是 uint8 的别名，对于只占用 1 个字节的传统 ASCII 编码的字符来说，完全没有问题，例如 var ch byte = 'A'，字符使用单引号括起来。
	*/
	runes := []rune(origString)
	fmt.Printf("runes: %v\n", runes)
    for from, to := 0, len(runes)-1; from < to; from, to = from+1, to-1 {
        runes[from], runes[to] = runes[to], runes[from]
    }

    revertedString := string(runes)

	fmt.Printf("origString = %v, revertedString: %v\n", origString, revertedString)

	if 0 == strings.Compare(origString, revertedString) {
		return true
	} else {
		return false
	}
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	x := 121
	fmt.Printf("%v is palinrom: %v\n\n", x, isPalindrome(x))
	fmt.Printf("%v is palinrom: %v\n\n", x, isPalindromeUseString(x))

	x = 1011
	fmt.Printf("%v is palinrom: %v\n\n", x, isPalindrome(x))
	fmt.Printf("%v is palinrom: %v\n\n", x, isPalindromeUseString(x))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
