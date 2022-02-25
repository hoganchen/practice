package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

// http://books.studygolang.com/gowebexamples/routes-using-gorilla-mux/
// go run 02Mux.go
// curl http://127.0.0.1:8080/books/hello-rust/page/1000
/*
	Go 的net/http 包提供了许多HTTP协议功能的函数。有一件事件，它还做的不够好，比如对于复杂的请求路由把请求的url分割成单个参数。
	幸运的是，在Go的社区里，有一个非常流行的package 来解决这个问题。
	在本例中，你将会看到如何用 gorilla/mux以命名参数、GET/POST Hander 和域名限制的形式来创建路由
	Installing the gorilla/mux package

	gorilla/mux 在写web 应用时，它带来了许多特性来提升生产效率。它在创建的时候，
	形态上和GO原始创建request handler 在创建形式上相似:func (w http.ResponseWriter, r *http.Request).
	所以这个包可以和其他HTTP 库混合使用，比如middleware 或已经存在的应用。通过 go get从 Github 上下载安装:

	go get -u github.com/gorilla/mux
*/
func main() {
	/*
		Creating a new Router

		首先创建一个新的路由。对于你的web应用，这个路由是主路由，它会传递参数到你的server.它会接受所有的HTTP链接，
		同时发送到你注册的request handler 上。你可以像下面一下创建:

		r := mux.NewRouter()
	*/
	r := mux.NewRouter()

	/*
		Registering a Request Handler

		当你已经创建了一个路由，你可以像内置包那样注册request handler.唯一不同的是，调用 http.HandleFunc(...)时，你可以用r.HandleFunc(...) 来代替.
		URL Parameters

		gorilla/mux 路由最具有能量的地方是从请求的URL上提取信息。作为一个例子，比如下面是你应用的URL:

		/books/go-programming-blueprint/page/10

		这个URL有两个动态部分:

		    Book 的标题(go-programming-blueprint)
		    页数 (10)

		对于上面提到的URL,在处理request handler时， 你可以如下处理，来做动态参数处理:

		r.HandleFunc("/books/{title}/page/{page}", func(w http.ResponseWriter, r *http.Request) {
			// get the book
			// navigate to the page
		})

		最后一件事就是从动态参数中获取数据。这个包提供一个函数mux.Vars(r) ,它把http.Request作为一个参数，并把动态参数以map的形式返回.

		func(w http.ResponseWriter, r *http.Request) {
			vars := mux.Vars(r)
			vars["title"] // the book title slug
			vars["page"] // the page
		}
	*/
	r.HandleFunc("/books/{title}/page/{page}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		title := vars["title"]
		page := vars["page"]

		n, _ := fmt.Fprintf(w, "You've requested the book: %s on page %s\n", title, page)
		log.Printf("n: %v\n", n)
	})

	/*
		Setting the HTTP server’s router

		想知道nil 在http.ListenAndServe(":80", nil) 的意义？它是HTTP server d的主路由的参数。
		默认情况下，它是nil， 它表示用net/http包的默认路由。 为了利用你自己的路由，用你的路由参数r 取代 nil

		http.ListenAndServe(":80", r)
	*/
	err := http.ListenAndServe(":8080", r)
	if err != nil {
		log.Fatalf("ListenAndServe error, err msg: %v\n", err)
	}
}
