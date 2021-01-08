/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

type TestStruct struct{}

func NilOrNot(v interface{}) bool {
	fmt.Printf("&v = %p, v = %p\n", &v, v)
	return v == nil
}

/*
我们简单总结一下上述代码执行的结果:
    将上述变量与nil比较会返回true;
    将上述变量传入NilOrNot方法并与nil比较会返回false;
出现上述现象的原因是——调用NilOrNot函数时发生了隐式的类型转换,除了向方法传入参数之外,变量的赋值也会触发隐式类型转换。
在类型转换时,*TestStruct类型会转换成interface{}类型,转换后的变量不仅包含转换前的变量,还包含变量的类型信息TestStruct,
所以转换后的变量与nil不相等。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var s *TestStruct
	fmt.Printf("&s = %p, s = %p\n", &s, s)
	fmt.Printf("s is nil? %v\n", s == nil)
	fmt.Printf("s in NirlOrNot is nil? %v\n", NilOrNot(s))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
