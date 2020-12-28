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
当我们想要在 Go 语言中初始化一个结构时，可能会用到两个不同的关键字 — make 和 new。因为它们的功能相似，所以初学者可能会对这两个关键字的作用感到困惑1，但是它们两者能够初始化的却有较大的不同。

    make 的作用是初始化内置的数据结构，也就是我们在前面提到的切片、哈希表和 Channel；
	new 的作用是根据传入的类型分配一片内存空间并返回指向这片内存空间的指针；

make 也是用于内存分配的，但是和 new 不同，它只用于 chan、map 以及切片的内存创建，而且它返回的类型就是这三个类型本身，而不是他们的指针类型，因为这三种类型就是引用类型，所以就没有必要返回他们的指针了。
make 返回的还是这三个引用类型本身；而 new 返回的是指向类型的指针。
new，它返回的永远是类型的指针，指向分配类型的内存地址。

func make(t Type, size …IntegerType) Type函数

// The make built-in function allocates and initializes an object of type
// slice, map, or chan (only). Like new, the first argument is a type, not a
// value. Unlike new, make's return type is the same as the type of its
// argument, not a pointer to it.


func new(Type) *Type函数

// The new built-in function allocates memory. The first argument is a type,
// not a value, and the value returned is a pointer to a newly
// allocated zero value of that type.

https://draveness.me/golang/docs/part2-foundation/ch05-keyword/golang-make-and-new/
https://blog.csdn.net/benben_2015/article/details/81069406
https://learnku.com/articles/23533
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	/*
    slice 是一个包含 data、cap 和 len 的私有结构体 internal/reflectlite.sliceHeader；
    hash 是一个指向 runtime.hmap 结构体的指针；
    ch 是一个指向 runtime.hchan 结构体的指针；
	*/
	slice := make([]int, 0, 100)
	hash := make(map[int]bool, 10)
	ch := make(chan int, 5)
	fmt.Printf("type(slice): %T\n", slice)
	fmt.Printf("type(hash): %T\n", hash)
	fmt.Printf("type(ch): %T\n", ch)

	/*
	相比与复杂的 make 关键字，new 的功能就很简单了，它只能接收一个类型作为参数然后返回一个指向该类型的指针
	*/
	i := new(int)

	var v int
	ii := &v

	// 上述代码片段中的两种不同初始化方法是等价的，它们都会创建一个指向 int 零值的指针。
	fmt.Printf("type(i): %T, i: %v, *i: %v\n", i, i, *i)
	fmt.Printf("type(ii): %T, ii: %v, *ii: %v\n", ii, ii, *ii)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
