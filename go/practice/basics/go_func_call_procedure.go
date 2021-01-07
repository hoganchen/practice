/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func myFunction(a, b int) (int, int) {
	return a + b, a - b
}

/*
分析如下输出：
go tool compile -S -N -l go_func_call_procedure.go

我们可以将本节的发现和分析简单总结成——当我们在x86_64的机器上使用C语言中调用函数时,参数都是通过寄存器和栈传递的,其中:
六个以及六个以下的参数会按照顺序分别使用edi、esi、edx、ecx、r8d和r9d六个寄存器传递;
六个以上的参数会使用栈传递,函数的参数会以从右到左的顺序依次存入栈中;
而函数的返回值是通过eax寄存器进行传递的,由于只使用一个寄存器存储返回值,所以C语言的函数不能同时返回多个值。

C语言和Go语言在设计函数的调用惯例时选择也不同的实现。C语言同时使用寄存器和栈传递参数,使用eax寄存器传递返回值;而Go语言使用栈传递参数和返回值。我们可以对比一下这两种设计的优点和缺点:
C语言的方式能够极大地减少函数调用的额外开销,但是也增加了实现的复杂度;
	CPU访问栈的开销比访问寄存器高几十倍3;
	需要单独处理函数参数过多的情况;
Go语言的方式能够降低实现的复杂度并支持多返回值,但是牺牲了函数调用的性能;
	不需要考虑超过寄存器数量的参数应该如何传递;
	不需要考虑不同架构上的寄存器差异;
	函数入参和出参的内存空间需要在栈上进行分配;
Go语言使用栈作为参数和返回值传递的方法是综合考虑后的设计,选择这种设计意味着编译器会更加简单、更容易维护。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	myFunction(66, 77)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
