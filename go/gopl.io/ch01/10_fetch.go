// Copyright © 2016 Alan A. A. Donovan & Brian W. Kernighan.
// License: https://creativecommons.org/licenses/by-nc-sa/4.0/

// See page 16.
//!+

// Fetch prints the content found at each specified URL.
package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
)

/*
这个程序从两个package中导入了函数,net/http和io/ioutil包,http.Get函数是创建HTTP请求的函数,如果获取过程没有出错,
那么会在resp这个结构体中得到访问的请求结果。resp的Body字段包括一个可读的服务器响应流。ioutil.ReadAll函数从response中读取到全部内容;
将其结果保存在变量b中。resp.Body.Close关闭resp的Body流,防止资源泄露,Printf函数会将结果b写出到标准输出流中。
*/
// go run 10_fetch.go https://go-zh.org/ https://www.baidu.com http://cn.bing.com https://www.google.com
func main() {
	for _, url := range os.Args[1:] {
		resp, err := http.Get(url)
		if err != nil {
			fmt.Fprintf(os.Stderr, "fetch: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("resp.Status:", resp.Status, "\n\n\n\n\n")
		b, err := ioutil.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			fmt.Fprintf(os.Stderr, "fetch: reading %s: %v\n", url, err)
			os.Exit(1)
		}
		fmt.Printf("%s\n", b)
	}
}

//!-
