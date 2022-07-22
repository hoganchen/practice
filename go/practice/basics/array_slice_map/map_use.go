/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func modify_map(m map[int]int) {
	fmt.Printf("modify_map function: &m: %p, m: %p, m: %v\n", &m, m, m)
	m[1] = 100
	m[2] = 200
}

func init_and_modify_map(mm map[int]int) {
	fmt.Printf("init_and_modify_map function: &mm: %p, mm: %p, mm: %v\n", &mm, mm, mm)
	mm = make(map[int]int)
	fmt.Printf("init_and_modify_map function: &mm: %p, mm: %p, mm: %v\n", &mm, mm, mm)
	mm[1] = 300
	mm[2] = 500
	fmt.Printf("init_and_modify_map function: &mm: %p, mm: %p, mm: %v\n", &mm, mm, mm)
}

// https://www.cnblogs.com/snowInPluto/p/7477365.html
/*
从如下打印可以看出，map可以通过make或者直接赋值的方式初始化，没有初始化的map为nil map，不能直接赋值，因为这是map的底层数据结构没有生成，指向的是0地址
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	m := make(map[int]int)
	// &m: 0xc0000ba020, m: 0xc0000a0180，m已经初始化
	fmt.Printf("main function: &m: %p, m: %p, m: %v\n", &m, m, m)
	modify_map(m)
	fmt.Printf("main function: &m: %p, m: %p, m: %v\n", &m, m, m)

	// https://blog.csdn.net/wade3015/article/details/100149338
	// https://cyent.github.io/golang/datatype/map_nil/
	// nil map不能直接赋值，需要先初始化，可用make函数初始化
	var mm map[int]int
	// &mm: 0xc000084020, mm: 0x0，由此可以看出，mm的地址为0地址，即m是没有初始化的
	fmt.Printf("main function: &mm: %p, mm: %p, mm: %v\n", &mm, mm, mm)
	init_and_modify_map(mm)
	fmt.Printf("main function: &mm: %p, mm: %p, mm: %v\n", &mm, mm, mm)

	var mmm = map[int]int{}
	// &mmm: 0xc0000ba040, mmm: 0xc0000a0420，由此可以看出，mmm的地址不为0，即mmm已初始化
	fmt.Printf("main function: &mmm: %p, mmm: %p, mmm: %v\n", &mmm, mmm, mmm)
	modify_map(mmm)
	fmt.Printf("main function: &mmm: %p, mmm: %p, mmm: %v\n", &mmm, mmm, mmm)
	init_and_modify_map(mmm) //mmm在函数中又重新初始化，因为重新初始化，底层数据结构指向了新的地址，所以不会影响main函数中mmm的数据
	fmt.Printf("main function: &mmm: %p, mmm: %p, mmm: %v\n", &mmm, mmm, mmm)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
