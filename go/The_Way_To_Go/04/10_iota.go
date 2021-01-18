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
在这个例子中,iota可以被用作枚举值:
const(
	a = iota
	b = iota
	c = iota
)
第一个iota等于0,每当iota在新的一行被使用时,它的值都会自动加1;所以a=0,b=1,c=2可以简写为如下形式:
const(
	a = iota
	b
	c
)
(译者注:关于iota的使用涉及到非常复杂多样的情况,这里作者解释的并不清晰,因为很难对iota的用法进行直观的文字描述。
*/
const (
	aa = iota
	bb
	cc
)

/*
iota也可以用在表达式中,如:iota + 50。
在每遇到一个新的常量块或单个常量声明时,iota都会重置为0(简单地讲,每遇到一次const关键字,iota就重置为0)
*/
const (
	ii = iota + 50
	jj
	kk
)

// 引用time包中的一段代码作为示例:一周中每天的名称
const (
	Sunday = iota
	Monday
	Tuesday
	Wednesday
	Thrusday
	Friday
	Saturday
)

type Color int
const (
	RED Color = iota
	ORANGE
	YELLOW
	GREEN
	BLUE = iota + 5
	INDIGO
	VIOLET
)

type ByteSize float64
const (
	_ = iota // 通过赋值给空白标识符来忽略值
	KB ByteSize = 1 << (10 * iota)
	MB
	GB
	TB
	PB
	EB
	ZB
	YB
)

/*
变量的命名规则遵循骆驼命名法,即首个单词小写,每个新单词的首字母大写,例如: startDate和numShips。
但如果你的全局变量希望能够被外部包所使用,则需要将首个单词的首字母也大写(第4.2节:可见性规则)。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	fmt.Printf("aa = %v, bb = %v, cc = %v\n", aa, bb, cc)
	fmt.Printf("ii = %v, jj = %v, kk = %v\n", ii, jj, kk)

	fmt.Println(Sunday, Monday, Tuesday, Wednesday, Thrusday, Friday, Saturday)
	fmt.Println(RED, ORANGE, YELLOW, GREEN, BLUE, INDIGO, VIOLET)
	fmt.Printf("%v, %v, %v, %v, %v, %v, %v, %v\n", KB, MB, GB, TB, PB, EB, ZB, YB)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
