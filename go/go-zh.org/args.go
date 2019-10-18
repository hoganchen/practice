// Echo1 prints its command-line arguments.

package main

import (
	"fmt"
	"os"
)

func main() {
	var s, sep string
	for i := 1; i < len(os.Args); i++ {
		s += sep + os.Args[i]
		sep = " "
		fmt.Printf("os.Args[%v] = %v\n", i, os.Args[i])
	}

	fmt.Printf("s is: %v\n", s)
	fmt.Println("s is:", s)
}