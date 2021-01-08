/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"reflect"
)

/*
调用reflect.ValueOf函数获取变量指针;
调用reflect.Value.Elem方法获取指针指向的变量;
调用reflect.Value.SetInt方法更新变量的值:由于Go语言的函数调用都是值传递的,所以我们只能先获取指针对应的reflect.Value,
再通过reflect.Value.Elem方法迂回的方式得到可以被设置的变量,我们通过如下所示的代码理解这个过程:
func main() {
	i := 1
	v := &i
	*v = 10
}
如果不能直接操作i变量修改其持有的值,我们就只能获取i变量所在地址并使用*v修改所在地址中存储的整数。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	i := 1
	v := reflect.ValueOf(&i)
	v.Elem().SetInt(10)
	fmt.Println(i)

	// Go语言的函数调用都是传值的,所以我们得到的反射对象跟最开始的变量没有任何关系,所以直接对它修改会导致崩溃。
	// vv := reflect.ValueOf(i)
	// // panic: reflect: reflect.Value.SetInt using unaddressable value
	// vv.SetInt(10)
	// fmt.Println(i)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
