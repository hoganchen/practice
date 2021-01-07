/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"unsafe"
)

type MyStruct struct {
	i int
	j int
}

/*
在这段代码中,我们通过指针的方式修改结构体中的成员变量,结构体在内存中是一片连续的空间,指向结构体的指针也是指向这个结构体的首地址。
将MyStruct指针修改成int类型的,那么访问新指针就会返回整型变量i,将指针移动8个字节之后就能获取下一个成员变量j。

当我们对Go语言中大多数常见的数据结构进行验证之后,其实就能够推测出Go语言在传递参数时其实使用的就是传值的方式,接收方收到参数时会对这些参数进行复制;了解到这一点之后,在传递数组或者内存占用非常大的结构
体时,我们在一些函数中应该尽量使用指针作为参数类型来避免发生大量数据的拷贝而影响性能。
*/
func myFunction(ms *MyStruct) {
	ptr := unsafe.Pointer(ms)

	for i := 0; i < 2; i++ {
		c := (* int)(unsafe.Pointer((uintptr(ptr)) + uintptr(8 * i)))
		*c += i + 1
		fmt.Printf("[%p] %d\n", c, *c)
	}
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	a := &MyStruct{i: 40, j: 50}
	fmt.Printf("[%p] %d\n", a, *a)
	myFunction(a)
	fmt.Printf("[%p] %d\n", a, *a)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
