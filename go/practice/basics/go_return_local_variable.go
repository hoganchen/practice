/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func return_local_variable_01() * int {
	i := 98765
	p := &i

	fmt.Printf("&p = %p, p = %p, *p = %v\n", &p, p, *p)

	return p
}

func return_local_variable_02() * int {
	i := 12345
	p := &i

	fmt.Printf("&p = %p, p = %p, *p = %v\n", &p, p, *p)

	return p
}

/*
我们能看到foo_val3是返回给main的局部变量, 其中他的地址应该是0xc000082000,很明显与其他的foo_val1、2、3、4不是连续的.
我们用go tool compile测试一下
$ go tool compile -m pro_2.go
pro_2.go:24:6: can inline main
pro_2.go:7:9: moved to heap: foo_val3
果然,在编译的时候, foo_val3具有被编译器判定为逃逸变量, 将foo_val3放在堆中开辟.

我们在用汇编证实一下:
$ go tool compile -S pro_2.go > pro_2.S
打开pro_2.S文件, 搜索runtime.newobject关键字
看出来, foo_val3是被runtime.newobject()在堆空间开辟的, 而不是像其他几个是基于地址偏移的开辟的栈空间.
*/
func foo(arg_val int) (*int) {
	var foo_val1 int = 11;
	var foo_val2 int = 12;
	var foo_val3 int = 13;
	var foo_val4 int = 14;
	var foo_val5 int = 15;

	//此处循环是防止go编译器将foo优化成inline(内联函数)
	//如果是内联函数，main调用foo将是原地展开，所以foo_val1-5相当于main作用域的变量
	//即使foo_val3发生逃逸，地址与其他也是连续的
	for i := 0; i < 5; i++ {
		println(&arg_val, &foo_val1, &foo_val2, &foo_val3, &foo_val4, &foo_val5)
	}

	//返回foo_val3给main函数
	return &foo_val3;
}

/*
三、new的变量在栈还是堆?
那么对于new出来的变量,是一定在heap中开辟的吗,我们来看看
我们将foo_val1-5全部用new的方式来开辟, 编译运行看结果
很明显, foo_val3的地址0xc00001a0e0 依然与其他的不是连续的. 依然具备逃逸行为.

四、结论
Golang中一个函数内局部变量，不管是不是动态new出来的，它会被分配在堆还是栈，是由编译器做逃逸分析之后做出的决定。
按理来说, 人家go的设计者明明就不希望开发者管这些,但是面试官就偏偏找这种问题问? 醉了也是.
*/
func foo_new(arg_val int) (*int) {
	var foo_val1 * int = new(int);
	var foo_val2 * int = new(int);
	var foo_val3 * int = new(int);
	var foo_val4 * int = new(int);
	var foo_val5 * int = new(int);

	//此处循环是防止go编译器将foo优化成inline(内联函数)
	//如果是内联函数，main调用foo将是原地展开，所以foo_val1-5相当于main作用域的变量
	//即使foo_val3发生逃逸，地址与其他也是连续的
	for i := 0; i < 5; i++ {
		println(arg_val, foo_val1, foo_val2, foo_val3, foo_val4, foo_val5)
	}

	//返回foo_val3给main函数
	return foo_val3;
}

// https://segmentfault.com/a/1190000021936165
// https://blog.csdn.net/li_101357/article/details/80209413
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	fmt.Printf("\n############################## return_local_variable_01 ##############################\n")
	pp := return_local_variable_01()
	fmt.Printf("&pp = %p, pp = %p, type(pp) = %T, *pp = %v\n", &pp, pp, pp, *pp)

	fmt.Printf("\n############################## return_local_variable_02 ##############################\n")
	ppp := return_local_variable_02()
	fmt.Printf("&ppp = %p, ppp = %p, type(ppp) = %T, *ppp = %v\n", &ppp, ppp, ppp, *ppp)

	fmt.Printf("\n############################## foo ##############################\n")
	main_val := foo(123)
	fmt.Printf("&main_val = %p, main_val = %p, type(main_val) = %T, *main_val = %v\n", &main_val, main_val, main_val, *main_val)

	fmt.Printf("\n############################## foo_new ##############################\n")
	new_main_val := foo_new(456)
	fmt.Printf("&new_main_val = %p, new_main_val = %p, type(new_main_val) = %T, *new_main_val = %v\n", &new_main_val, new_main_val, new_main_val, *new_main_val)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
