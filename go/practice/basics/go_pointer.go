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

	var i int
	p := &i
	var pp *int
	var ppp *int = &i

	fmt.Printf("&i = %p, i = %v\n", &i, i)
	fmt.Printf("&p = %p, p = %p, *p = %v\n", &p, p, *p)
	// panic: runtime error: invalid memory address or nil pointer dereference， pp指向了0地址
	// fmt.Printf("&pp = %p, pp = %p, *pp = %v\n", &pp, pp, *pp)
	fmt.Printf("&pp = %p, pp = %p\n", &pp, pp)
	fmt.Printf("&ppp = %p, ppp = %p, *ppp = %v\n", &ppp, ppp, *ppp)

	// cannot convert p (type *int) to type int
	// pppp := int(p) + 1

	// invalid operation: p + 1 (mismatched types *int and int)
	// pppp := p + 1

	// cannot use "abcdefg" (type string) as type *string in assignment
	// var s *string = "abcdefg"

	s := "abcdefg"
	ps := &s
	pps := &ps
	var ss = &s

	fmt.Printf("&s = %p, type(s) = %T, s = %v\n", &s, s, s)
	fmt.Printf("&ps = %p, type(ps) = %T, ps = %p, *ps = %v\n", &ps, ps, ps, *ps)
	fmt.Printf("&ss = %p, type(ss) = %T, ss = %p, *ss = %v\n", &ss, ss, ss, *ss)
	fmt.Printf("&pps = %p, type(pps) = %T, pps = %p, type(*pps) = %T, *pps = %v, type(**pps) = %T, **pps = %v\n", &pps, pps, pps, *pps, *pps, **pps, **pps)

	// new() 函数可以创建一个对应类型的指针，创建过程会分配内存。被创建的指针指向的值为默认值。
	str := new(string)
	fmt.Printf("&str = %p, type(str) = %T, str = %p, *str = %v\n", &str, str, str, *str)
	*str = "abcdefghijklmn"
	fmt.Printf("&str = %p, type(str) = %T, str = %p, *str = %v\n", &str, str, str, *str)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
