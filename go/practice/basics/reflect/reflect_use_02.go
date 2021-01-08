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
从反射对象到接口值的过程就是从接口值到反射对象的镜面过程,两个过程都需要经历两次转换:
从接口值到反射对象:
  从基本类型到接口类型的类型转换;
  从接口类型到反射对象的转换;
从反射对象到接口值:
  反射对象转换成接口类型;
  通过显式类型转换变成原始类型;
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	fmt.Printf("reflect.ValueOf(1): %v\n", reflect.ValueOf(1))
	fmt.Printf("reflect.TypeOf(1): %v\n", reflect.TypeOf(1))

	v := reflect.ValueOf(1)
	s := reflect.TypeOf(1)
	fmt.Printf("v.Interface().(int): %v\n", v.Interface().(int))
	fmt.Printf("type(v): %T, type(s): %T\n", v, s)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
