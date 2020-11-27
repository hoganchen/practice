/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

type Shape interface {
    Area() float64
}

type Object interface {
    Volume() float64
}

type Skin interface {
    Color() float64
}

type Cube struct {
    side float64
}

func (c Cube)Area() float64 {
    return c.side * c.side
}

func (c Cube)Volume() float64 {
    return c.side * c.side * c.side
}

/*
因为在程序运行中, 有时会无法确定接口值的动态类型, 因此通过类型断言可以来检测其是否是一个特定的类型, 这样便可以针对性的进行业务处理.

结合类型断言, 我们就可以处理空接口的问题.比如说, 某个方法定义的入参类型为一个接口类型, 我们就可以在函数内部使用类型断言处理不同的业务.

https://zhuanlan.zhihu.com/p/63219494
*/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	var s Shape = Cube{3.0}
    value1, ok1 := s.(Object)
    fmt.Printf("dynamic value of Shape 's' with value %v implements interface Object? %v\n", value1, ok1)
    value2, ok2 := s.(Skin)
    fmt.Printf("dynamic value of Shape 's' with value %v implements interface Skin? %v\n", value2, ok2)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
