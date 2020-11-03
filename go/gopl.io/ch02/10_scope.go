/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"os"
	"log"
	"fmt"
)

var cwd string
var bvar bool

/*
对于在包级别声明的变量,如果有初始化表达式则用表达式初始化,还有一些没有初始化表达式的,例如某些表格数据初始化并不是一个简单的赋值过程。
在这种情况下,我们可以用一个特殊的init初始化函数来简化初始化工作。每个文件都可以包含多个init初始化函数

这样的init初始化函数除了不能被调用或引用外,其他行为和普通函数类似。在每个文件中的init初始化函数,
在程序开始执行时按照它们声明的顺序被自动调用。
*/
func init() {
	var err error
	cwd, err = os.Getwd()
	if err != nil {
		log.Fatalf("os.Getwd failed: %v", err)
	}
}

func init_func() {
	bvar = true
}

func scope() {
	/*
	同样有三个不同的x变量,每个声明在不同的词法域,一个在函数体词法域,一个在for隐式的初始化词法域,一个在for循环体词法域;
	只有两个块是显式创建
	*/
	x := "hello"
	for _, x := range x {
		x := x + 'A' - 'a'
		fmt.Printf("%c", x) //"HELLO" (one letter per iteration)
	}
}

func to_upper(s string) string {
	rs := ""
	/*
	每次循环迭代, range产生一对值;索引以及在该索引处的元素值。这个例子不需要索引, 但range的语法要求, 要处理元素, 必须处理索引。
	for index, value := range pc {

	一种思路是把索引赋值给一个临时变量, 如 temp , 然后忽略它的值,但Go语言不允许使用无用的局部变量(local variables),因为这会导致编译错误。
	Go语言中这种情况的解决方法是用 空标识符 (blankidentifier),即 _ (也就是下划线)。
	空标识符可用于任何语法需要变量名但程序逻辑不需要的时候, 例如, 在循环里,丢弃不需要的循环索引, 保留元素值。
	for _, value := range pc {

	range循环只使用了索引,省略了没有用到的值部分。循环也可以这样写
	for i, _ := range pc {
	*/
	for _, x := range s {
		if x >='a' && x <= 'z' {
			// y := x + 'A' - 'a'
			// fmt.Printf("y = %c\n", y)
			rs += string(x + 'A' - 'a')
		} else {
			rs += string(x)
		}

		// fmt.Printf("rs: %v\n", rs)
	}

	return rs
}

func ff() int {
	x := 99
	return x
}

func gg(x int) int {
	y := x + 999
	return y
}

func if_scope() {
	x := 666; y := 888

	/*
	先执行x := ff()，然后用得到的x值与0比较，与以下语句一样
	x := ff()
	if x == 0 {}

	第二个if语句嵌套在第一个内部,因此第一个if语句条件初始化词法域声明的变量在第二个if中也可以访问。
	switch语句的每个分支也有类似的词法域规则:条件部分为一个隐式词法域,然后每个是每个分支的词法域。
	*/
	if x := ff(); x == 0 {
		fmt.Println(x)
	} else if y := gg(x); x == y {
		fmt.Println(x, y)
	} else {
		fmt.Println(x, y)
	}

	fmt.Println(x, y) // compile error: x and y are not visible here
}

func main() {
	fmt.Printf("cwd: %v\n", cwd)
	fmt.Printf("Hello world!\n")

	x:= "hello!"
	/*
	for语句创建了两个词法域:花括弧包含的是显式的部分是for的循环体部分词法域,另外一个隐式的部分则是循环的初始化部分,
	比如用于迭代变量i的初始化。隐式的词法域部分的作用域还包含条件测试部分和循环后的迭代部分(i++),当然也包含循环体词法域。
	*/
	for i := 0; i < len(x); i++ {
		// 在x[i]和x + 'A' - 'a'声明语句的初始化的表达式中都引用了外部作用域声明的x变量
		x := x[i]
		if x != '!' {
			x := x + 'A' - 'a'
			fmt.Printf("%c", x) //"HELLO" (one letter per iteration)
		}
	}

	fmt.Println()

	scope()
	fmt.Println()

	fmt.Printf("%v\n", to_upper("fdasLFJAfdfd!#$))aslAFfd"))

	if_scope()

	fmt.Printf("bvar: %v\n", bvar)
	init_func()
	fmt.Printf("bvar: %v\n", bvar)
}
