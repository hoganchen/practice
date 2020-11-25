package main

import (
	"fmt"
	"sort"
)

// prereqs maps computer science courses to their prerequisites.
var prereps = map[string][]string{
	"algorithms": {"data structures"},
	"calculus":   {"linear algebra"},

	"compilers": {
		"data structures",
		"formal languages",
		"computer organization",
	},

	"data structures":       {"discrete math"},
	"databases":             {"data structures"},
	"discrete math":         {"intro to programming"},
	"formal languages":      {"discrete math"},
	"networks":              {"operating systems"},
	"operating systems":     {"data structures", "computer organization"},
	"programming languages": {"data structures", "computer organization"},
}

/*
考虑这样一个问题:给定一些计算机课程,每个课程都有前置课程,只有完成了前置课程才可以开始当前课程的学习;
我们的目标是选择出一组课程,这组课程必须确保按顺序学习时,能全部被完成。

这类问题被称作拓扑排序。从概念上说,前置条件可以构成有向图。图中的顶点表示课程,边表示课程间的依赖关系。显然,图中应该无环,
这也就是说从某点出发的边,最终不会回到该点。下面的代码用深度优先搜索了整张图,获得了符合要求的课程序列。
*/
func main() {
	for i, course := range topoSort(prereps) {
		fmt.Printf("%d:\t%s\n", i+1, course)
	}
}

func topoSort(m map[string][]string) []string {
	var order []string
	seen := make(map[string]bool)
	var visitAll func(items []string)
	visitAll = func(items []string) {
		for _, item := range items {
			if !seen[item] {
				seen[item] = true
				visitAll(m[item])
				order = append(order, item)
			}
		}
	}
	var keys []string
	for key := range m {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	visitAll(keys)
	return order
}
