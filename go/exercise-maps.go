package main

import (
	"golang.org/x/tour/wc"
	"strings"
)

func WordCount(s string) map[string]int {
	retmap := make(map[string]int)
	s_fields := strings.Fields(s)

	for i := 0; i < len(s_fields); i++ {
		retmap[s_fields[i]]++
	}

	return retmap
	// return map[string]int{"x": 1}
}

func main() {
	wc.Test(WordCount)
}
