package main

import (
	"fmt"
	"log"
	"os"

	"./links"
)

// breadthFirst calls f for each item in the worklist.
// Any items returned by f are added to the worklist.
// f is called at most once for each item.
func breadthFirst(f func(item string) []string, worklist []string) {
	seen := make(map[string]bool)
	for len(worklist) > 0 {
		items := worklist
		worklist = nil
		for _, item := range items {
			if !seen[item] {
				seen[item] = true
				worklist = append(worklist, f(item)...)
			}
		}
	}
}

func crawl(url string) []string {
	fmt.Println(url)
	list, err := links.Extract(url)
	if err != nil {
		log.Print(err)
	}
	return list
}

// go run 09_findlinks3.go https://www.qq.com
// go run 09_findlinks3.go https://www.baidu.com
// go run 09_findlinks3.go https://www.hao123.com
// go run 09_findlinks3.go http://go-zh.org
/*
下面的函数实现了广度优先算法。调用者需要输入一个初始的待访问列表和一个函数f。待访问列表中的每个元素被定义为string类型。
广度优先算法会为每个元素调用一次f。每次f执行完毕后,会返回一组待访问元素。这些元素会被加入到待访问列表中。
当待访问列表中的所有元素都被访问后,breadthFirst函数运行结束。为了避免同一个元素被访问两次,代码中维护了一个map。

当所有发现的链接都已经被访问或电脑的内存耗尽时,程序运行结束。
*/
func main() {
	// Crawl the web breadth-first,
	// starting from the command-line arguments.
	breadthFirst(crawl, os.Args[1:])
}
