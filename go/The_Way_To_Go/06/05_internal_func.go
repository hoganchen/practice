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
名称					说明
close					用于管道通信
len、cap				len用于返回某个类型的长度或数量(字符串、数组、切片、map和管道);cap是容量的意思,用于返回某个类型的最大容量(只能用于切片和	map)
new、make				new和make均是用于分配内存:new用于值类型和用户定义的类型,如自定义结构,make用于内置引用类型(切片、map和管道)。它们的用法就像是函数,但是将类型作为参数:new(type)、make(type)。new(T)分配类型T的零值并返回其地址,也就是指向类型T的指针(详见第10.1节)。它也可以被用于基本类型: v := new(int)。make(T)返回类型T的初始化之后的值,因此它比new进行更多的工作(详见第7.2.3/4节、第8.1.1节和第14.2.1节)new()是一个函数,不要忘记它的括号
copy、append			用于复制和连接切片
panic、recover			两者均用于错误处理机制
print、println			底层打印函数(详见第4.2节),在部署环境中建议使用fmt包
complex、real、imag		用于创建和操作复数(详见第4.5.2.2节)
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	ch := make(chan int, 10)
	for i := 0; i < 10; i++ {
		ch <- i
	}
	close(ch)

	s := "hello, golang"
	a := [100]int{}
	sl := make([]int, 10, 20)
	m := make(map[string]int, 10)

	m["a"] = 1
	m["b"] = 2
	fmt.Printf("a type: %T, a[:] type: %T, sl type: %T, &sl = %p, sl = %p\n", a, a[:], sl, &sl, sl)
	fmt.Printf("len(s) = %v, len(a) = %v, len(sl) = %v, len(m) = %v, len(ch) = %v\n", len(s), len(a), len(sl), len(m), len(ch))
	fmt.Printf("cap(sl) = %v\n", cap(sl))
	// invalid argument m (type map[string]int) for cap
	// fmt.Printf("cap(sl) = %v, cap(m) = %v\n", cap(sl), cap(m))

	<- ch
	m["c"] = 3
	m["d"] = 4
	sl = append(sl, a[:]...)
	fmt.Printf("a type: %T, a[:] type: %T, sl type: %T, &sl = %p, sl = %p\n", a, a[:], sl, &sl, sl)
	fmt.Printf("len(s) = %v, len(a) = %v, len(sl) = %v, len(m) = %v, len(ch) = %v\n", len(s), len(a), len(sl), len(m), len(ch))
	fmt.Printf("cap(sl) = %v\n", cap(sl))

	/*
	Go语言的内置函数copy()可以将一个数组切片复制到另一个数组切片中，如果加入的两个数组切片不一样大，就会按照其中较小的那个数组切片的元素个数进行复制。

	copy()函数的使用格式如下：
	copy(destSlice, srcSlice []T) int

	其中 srcSlice为数据来源切片，destSlice为复制的目标（也就是将srcSlice复制到destSlice），
	目标切片必须分配过空间且足够承载复制的元素个数，并且来源和目标的类型必须一致，copy()函数的返回值表示实际发生复制的元素个数。

	下面的代码展示了使用 copy() 函数将一个切片复制到另一个切片的过程：
	slice1 := []int{1, 2, 3, 4, 5}
	slice2 := []int{5, 4, 3}
	copy(slice2, slice1) // 只会复制slice1的前3个元素到slice2中
	copy(slice1, slice2) // 只会复制slice2的3个元素到slice1的前3个位置
	*/
	var no_init_sl []int
	fmt.Printf("&no_init_sl = %p, no_init_sl = %p, len(no_init_sl) = %v, cap(no_init_sl) = %v\n", &no_init_sl, no_init_sl, len(no_init_sl), cap(no_init_sl))
	copy(sl, no_init_sl)
	fmt.Printf("&no_init_sl = %p, no_init_sl = %p, len(no_init_sl) = %v, cap(no_init_sl) = %v\n", &no_init_sl, no_init_sl, len(no_init_sl), cap(no_init_sl))
	fmt.Printf("cap(sl) = %v\n", cap(sl))
	copy(no_init_sl, sl)
	fmt.Printf("cap(sl) = %v\n", cap(sl))

	init_sl := make([]int, 10)
	fmt.Printf("&init_sl = %p, init_sl = %p, len(init_sl) = %v, cap(init_sl) = %v\n", &init_sl, init_sl, len(init_sl), cap(init_sl))
	copy(init_sl, sl)
	fmt.Printf("&init_sl = %p, init_sl = %p, len(init_sl) = %v, cap(init_sl) = %v\n", &init_sl, init_sl, len(init_sl), cap(init_sl))
	fmt.Printf("cap(sl) = %v\n", cap(sl))
	copy(init_sl, sl)
	fmt.Printf("cap(sl) = %v\n", cap(sl))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
