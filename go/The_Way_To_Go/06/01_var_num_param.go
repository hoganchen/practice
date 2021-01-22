/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func min(a ...int) int {
	fmt.Printf("len(a): %d\n", len(a))
	if len(a) == 0 {
		return 0
	}

	min := a[0]

	for _, v := range a {
		if v < min {
			min = v
		}
	}

	return min
}

/*
如果函数的最后一个参数是采用...type的形式,那么这个函数就可以处理一个变长的参数,这个长度可以为0,这样的函数称为变参函数。
func myFunc(a, b, arg ...int) {}

这个函数接受一个类似某个类型的slice的参数(详见第7章),该参数可以通过第5.4.4节中提到的for循环结构迭代。
示例函数和调用:
func Greeting(prefix string, who ...string)
Greeting("hello:", "Joe", "Anna", "Eileen")

在Greeting函数中,变量who的值为[]string{"Joe", "Anna", "Eileen"}。

如果参数被存储在一个数组arr中,则可以通过arr...的形式来传递参数调用变参函数。

但是如果变长参数的类型并不是都相同的呢?使用5个参数来进行传递并不是很明智的选择,有2种方案可以解决这个问题:
1. 使用结构(详见第10章):
定义一个结构类型,假设它叫Options,用以存储所有可能的参数:
type Options struct {
	par1 type1,
	par2 type2,
	...
}
函数F1可以使用正常的参数a和b,以及一个没有任何初始化的Options结构:F1(a, b, Options{})。
如果需要对选项进行初始化,则可以使用F1(a, b, Options {par1:val1, par2:val2})。

2. 使用空接口:
如果一个变长参数的类型没有被指定,则可以使用默认的空接口interface{},这样就可以接受任何类型的参数(详见第11.9节)。
该方案不仅可以用于长度未知的参数,还可以用于任何不确定类型的参数。
一般而言我们会使用一个for-range循环以及switch结构对每个参数的类型进行判断:
func typecheck(..,..,values ...interface{}) {
	for _, value := range values {
		switch v := value.(type) {
			case int: ...
			case float: ...
			case string: ...
			case bool: ...
			default: ...
		}
	}
}
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	x := min(1, 3, 5, 7, 9, 0)
	fmt.Printf("The minimum is: %d\n", x)

	arr := []int{7, 5, 8, 9, 1, 4, 6, 3}
	x = min(arr...)
	fmt.Printf("The minimum in the array arr is: %d\n", x)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
