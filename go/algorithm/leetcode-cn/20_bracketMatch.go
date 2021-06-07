/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func isValid(s string) bool {
	n := len(s)
	if 1 == n % 2{
		return false
	}

	pairs := map[byte]byte{'}': '{', ']': '[', ')': '('}
	// stack := []byte{}
	stack := make([]byte, 0)

	for i := 0; i < n; i++ {
		fmt.Printf("s[%v] = %c, stack = %v\n", i, s[i], stack)
		if _, ok := pairs[s[i]]; ok {
			fmt.Printf("stack[%v] = %v, pairs[%c] = %v\n", len(stack)-1, stack[len(stack)-1], s[i], pairs[s[i]])
			if 0 == len(stack) || stack[len(stack)-1] != pairs[s[i]] {
				return false
			}
			stack = stack[:len(stack)-1]
		} else {
			stack = append(stack, s[i])
		}
	}

	return 0 == len(stack)
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	s := "{[(())]}"
	ret := isValid(s)
	fmt.Printf("ret = %v\n", ret)

	s = "()"
	ret = isValid(s)
	fmt.Printf("ret = %v\n", ret)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
