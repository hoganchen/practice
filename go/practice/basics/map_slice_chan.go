/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

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
	fmt.Printf("main function: &i: %p, i: %p, i: %v\n", &i, i, i)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
