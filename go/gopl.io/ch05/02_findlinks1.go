// Findlinks1 prints the links in an HTML document read from standard input.
package main

import (
	"fmt"
	"os"
	"regexp"

	"golang.org/x/net/html"
)

/*
cannot find package "golang.org/x/net/html"错误解决(https://blog.csdn.net/wsliangjian/article/details/97253595)

mkdir -p $GOPATH/src/golang.org/x
cd $GOPATH/src/golang.org/x
git clone https://github.com/golang/net.git

*/
// go run ../ch01/10_fetch.go https://www.qq.com | go run 02_findlinks1.go
func main() {
	doc, err := html.Parse(os.Stdin)
	if err != nil {
		fmt.Fprintf(os.Stderr, "findlinks1: %v\n", err)
		os.Exit(1)
	}
	for _, link := range visit(nil, doc) {
		fmt.Println(link)
	}
}

// visit appends to links each link found in n and returns the result.
func visit(links []string, n *html.Node) []string {
	link_match, _ := regexp.Compile("^http")
	if n.Type == html.ElementNode && n.Data == "a" {
		for _, a := range n.Attr {
			if a.Key == "href" && link_match.Match([]byte(a.Val)) {
				links = append(links, a.Val)
			}
		}
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		links = visit(links, c)
	}
	return links
}
