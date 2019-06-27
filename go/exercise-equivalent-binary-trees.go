package main

import (
	"fmt"
	"golang.org/x/tour/tree"
)

// https://tour.go-zh.org/concurrency/7

type Tree struct {
    Left  *Tree
    Value int
    Right *Tree
}

// Walk 步进 tree t 将所有的值从 tree 发送到 channel ch。
func Walk(t *tree.Tree, ch chan int) {
	if t.Left != nil {
		Walk(t.Left, ch)
	}

	// 可尝试交换以下两行代码，查看打印的区别，了解goroutine的运行
	fmt.Printf("t.Value: %v\n", t.Value)
	ch <- t.Value

	if t.Right != nil {
		Walk(t.Right, ch)
	}

	// 注意的是，由于本函数是递归调用，所有不能使用close(ch)函数，这会导致panic错误
	// close(ch)
	// return
}

// Same 检测树 t1 和 t2 是否含有相同的值。
func Same(t1, t2 *tree.Tree) bool {
	const exec_index = 4
	ch1, ch2 := make(chan int), make(chan int)
	go Walk(t1, ch1)
	go Walk(t2, ch2)

	switch exec_index {
	case 0:
		if <-ch1 == <-ch2 {
			return true
		} else {
			return false
		}
	case 1:
		// the cap of ch1 is 0
		if cap(ch1) == cap(ch2) {
			for i := range ch1 {
				j := <- ch2
				if i != j {
					return false
				}
			}

			return true
		} else {
			return false
		}
	case 2:
		for i := range ch1 {
			j := <- ch2
			fmt.Printf("i = %v, j = %v\n", i, j)

			if i != j {
				return false
			}
		}

		return true
	case 3:
		for i:= range ch1 {
			if i != <- ch2 {
				return false
			}
		}

		return true

	case 4:
		for i:= 0; i < 10; i++ {
			if <-ch1 != <-ch2 {
				return false
			}
		}

		return true
	}

	return false
}

func main() {
	ch := make(chan int)
	t1 := tree.New(1)
	t2 := tree.New(2)

	//从信道中打印10个值
	go Walk(t1, ch)
	for i := 0; i < 10; i++ {
		fmt.Println(<-ch)
	}

	//从信道中打印10个值
	go Walk(t2, ch)
	for i := 0; i < 10; i++ {
		fmt.Println(<-ch)
	}

	//对tree1和tree2进行比较
	fmt.Println("tree 1 == tree 1:", Same(tree.New(1), tree.New(1)))
	fmt.Println("tree 1 == tree 2:", Same(tree.New(1), tree.New(2)))
}
