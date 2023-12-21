/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

// comparable表示约束类型为可比较的，前者是约束了可比较（==、!=）
// 官方又给我们搞了2个约束类型关键词：comparable和constraints.Ordered。从字母意思可以看得出来，前者是约束了可比较（==、!==），后者约束了可排序 (<、<=、>=、>)。
func MapKeys[K comparable, V any](m map[K]V) []K {
	r := make([]K, 0, len(m))
	for k := range m {
		r = append(r, k)
	}
	return r
}

type List[T any] struct {
	head, tail *element[T]
}

type element[T any] struct {
	next *element[T]
	val  T
}

func (lst *List[T]) Push(v T) {
	if lst.tail == nil {
		lst.head = &element[T]{val: v}
		lst.tail = lst.head
	} else {
		lst.tail.next = &element[T]{val: v}
		lst.tail = lst.tail.next
	}
}

func (lst *List[T]) Pop() {
	if lst.head != nil {
		lst.head = lst.head.next
	}
}

func (lst *List[T]) GetAll() []T {
	var elems []T
	for e := lst.head; e != nil; e = e.next {
		elems = append(elems, e.val)
	}
	return elems
}

// https://juejin.cn/post/7229535834999865405
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var m = map[int]string{1: "2", 2: "4", 4: "8"}

	fmt.Println("keys:", MapKeys(m))

	_ = MapKeys[int, string](m)

	// 实现自定义的泛型链表
	lst := List[int]{}
	lst.Push(10)
	lst.Push(13)
	lst.Push(23)
	fmt.Println("list:", lst.GetAll())
	lst.Pop()
	fmt.Println("list:", lst.GetAll())
	lst.Pop()
	fmt.Println("list:", lst.GetAll())
	lst.Pop()
	fmt.Println("list:", lst.GetAll())
	lst.Pop()
	fmt.Println("list:", lst.GetAll())

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
