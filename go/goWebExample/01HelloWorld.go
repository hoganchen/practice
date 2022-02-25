package main

import (
	"fmt"
	"log"
	"net/http"
)

// http://books.studygolang.com/gowebexamples/hello-world/
// go run 01HelloWorld.go
// curl http://127.0.0.1:8080/books/hello-rust/page/1000
func main() {
	/*
		首先，创建一个从浏览器接受进来的HTTP链接、HTTP client 或者API请求的Handler， 在Go 中是一个函数，它在创建的时候，形态上有如下相似特点:

		 func (w http.ResponseWriter, r *http.Request)

		这个函数接受两个参数:

		    http.ResponseWriter: 这个参数是给你写你的text/html响应的
		    http.Request : 它包含所有HTTP请求的信息，比如URL 或者 header

		注册一个的HTTP Server 的request handler 非常简单，如下就是:

		http.HandleFunc("/", func (w http.ResponseWriter, r *http.Request) {
			fmt.Fprintf(w, "Hello, you've requested: %s\n", r.URL.Path)
		})
	*/
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		n, _ := fmt.Fprintf(w, "Hello, you've requested: %s\n", r.URL.Path)
		log.Printf("n: %v\n", n)
	})

	/*
		Listen for HTTP Connections

		一个单独的request handler 不能接受任何外部的HTTP 链接。一个HTTP Server, 为了把链接发送给request handle， 它必须监听一个端口。
		由于80端口是大多数默认的HTTP 流量通道， 所以本server 也会用80端口来监控。下面的代码会启动一个GO的默认HTTP server,
		同时监听80端口上的链接。你可以在你的浏览器中访问 http://localhost/, 同时可以看到你的server 正在处理你的request

		http.ListenAndServe(":80", nil)
	*/
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("ListenAndServe error, err msg: %v\n", err)
	}
}
