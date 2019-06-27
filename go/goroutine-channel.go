package main

import (
	"fmt"
	"time"
	"math/rand"
)

const iter = 10

func Walk(s []int, ch chan int) {
	rand.Seed(time.Now().UnixNano())
	rand_int := rand.Intn(3)

	for i := 0; i < iter; i++ {
		if (i == iter - 1) && rand_int == 2 {
			s[i] = rand_int
		} else {
			s[i] = i
		}

		ch <- s[i]
	}

	// 因为有多个goroutine调用了该函数，所以不能使用close
	// close(ch)
}

// Same 检测树 t1 和 t2 是否含有相同的值。
func Same(t1, t2 []int) bool {
	const exec_index = 4
	ch1, ch2 := make(chan int), make(chan int)
	go Walk(t1, ch1)
	go Walk(t2, ch2)

	switch exec_index {
	case 0:
		// 该方法只判断了channel中第一个元素是否相等，不符合题意
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
		// 由于不能close channel，所以程序没法判断goroutine是否结束，所以需要自己判断结束条件
		for i:= range ch1 {
			if i != <- ch2 {
				return false
			}
		}

		return true

	case 4:
		for i:= 0; i < iter; i++ {
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
	s1 := make([]int, iter)
	s2 := make([]int, iter)

	//从信道中打印10个值
	go Walk(s1, ch)
	for i := 0; i < iter; i++ {
		// fmt.Println(<-ch)
		<-ch
	}

	fmt.Println("########################################")

	//从信道中打印10个值
	go Walk(s2, ch)
	for i := 0; i < iter; i++ {
		// fmt.Println(<-ch)
		<-ch
	}

	fmt.Println("s1: %v", s1)
	fmt.Println("s2: %v", s2)

	//compare
	fmt.Println("s1 == s2:", Same(s1, s2))
	fmt.Println("s1: %v", s1)
	fmt.Println("s2: %v", s2)

	s3 := make([]int, iter)
	s4 := make([]int, iter)
	// fmt.Println("new s1 == new s2:", Same(make([]int, iter), make([]int, iter)))
	fmt.Println("s3 == s4:", Same(s3, s4))
	fmt.Println("s3: %v", s3)
	fmt.Println("s4: %v", s4)
}
