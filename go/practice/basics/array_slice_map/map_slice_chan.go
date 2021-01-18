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
main function: &m: 0xc820030028, m: 0x0, m: map[], m is nil? true
main function: &s: 0xc82000e520, s: 0x0, s: [], s is nil? true
main function: &ch: 0xc820030030, ch: 0x0, ch: <nil>, ch is nil? true
main function: &i: 0xc82000a2e8, i: 0xc82000a2e8, i: 0
main function: &m: 0xc820030028, m: 0xc820012330, m: map[], m is nil? false
main function: &s: 0xc82000e520, s: 0xc82000a310, s: [], s is nil? false
main function: &ch: 0xc820030030, ch: 0xc82001a1e0, ch: 0xc82001a1e0, ch is nil? false

从如上打印即可看出，通过var声明的引用类型变量，是没有初始化的，指向都是0地址，有点类似于指针，map,slice和chan都可以通过make初始化

在Go语言中,指针(第4.9节)属于引用类型,其它的引用类型还包括slices(第7章),maps(第8章)和channel(第13章)。被引用的变量会存储在堆中,以便进行垃圾回收,且比栈拥有更大的内存空间。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	/*
	https://blog.golang.org/maps
	Map types are reference types, like pointers or slices, and so the value of m above is nil;
	it doesn't point to an initialized map. A nil map behaves like an empty map when reading,
	but attempts to write to a nil map will cause a runtime panic; don't do that. To initialize a map,
	use the built in make function:

	m = make(map[string]int)

	The make function allocates and initializes a hash map data structure and returns a map value that points to it.
	The specifics of that data structure are an implementation detail of the runtime and are not specified by the language itself.
	 In this article we will focus on the use of maps, not their implementation.
	*/
	// https://www.jianshu.com/p/7aa4aed71042
	// https://zhuanlan.zhihu.com/p/54988753
	// https://www.cnblogs.com/snowInPluto/p/7477365.html
	// https://learnku.com/articles/45323
	// https://www.geeksforgeeks.org/data-types-in-go/
	var m map[int]int
	var s []string
	var ch chan int
	var i int
	// map，slice和chan都属于引用类型，类似于指针，在使用前需要先初始化
	fmt.Printf("main function: &m: %p, m: %p, m: %v, m is nil? %v\n", &m, m, m, m == nil)
	fmt.Printf("main function: &s: %p, s: %p, s: %v, s is nil? %v\n", &s, s, s, s == nil)
	fmt.Printf("main function: &ch: %p, ch: %p, ch: %v, ch is nil? %v\n", &ch, ch, ch, ch == nil)
	// cannot convert nil to type int
	// fmt.Printf("main function: &i: %p, i: %p, i: %v, i is nil? %v\n", &i, i, i, i == nil)
	fmt.Printf("main function: &i: %p, i: %p, i: %v\n", &i, &i, i)

	m = make(map[int]int)
	s = make([]string, 1)
	ch = make(chan int)
	fmt.Printf("main function: &m: %p, m: %p, m: %v, m is nil? %v\n", &m, m, m, m == nil)
	fmt.Printf("main function: &s: %p, s: %p, s: %v, s is nil? %v\n", &s, s, s, s == nil)
	fmt.Printf("main function: &ch: %p, ch: %p, ch: %v, ch is nil? %v\n", &ch, ch, ch, ch == nil)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
