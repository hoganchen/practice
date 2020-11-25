package main

import (
	"fmt"
	"os"

	"./links"
)

// go run 08_links.go http://www.qq.com
func main() {
	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "usage: %s [url]", os.Args[0])
		os.Exit(1)
	}
	url := os.Args[1]
	links, err := links.Extract(url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "extracting links from %s: %v\n", url, err)
		os.Exit(1)
	}
	for _, l := range links {
		fmt.Println(l)
	}
}
