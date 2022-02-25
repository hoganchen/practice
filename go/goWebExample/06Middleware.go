// basic-middleware.go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func logging(f http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Println(r.URL.Path)
		f(w, r)
	}
}

func foo(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "foo")
}

func bar(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "bar")
}

/*
这个例子将展示在Go中创建基本的日志中间件.

这个例子将展示如何在GO中创建基本的日志中间件。一个中间件只需要一个http.HandlerFunc 作为它其中的一个参数，
装饰它，并返回一个新的http.HandlerFunc用于服务器调用
*/
// http://books.studygolang.com/gowebexamples/basic-middleware/
// $ curl http://127.0.0.1:8080/foo
// $ curl http://127.0.0.1:8080/bar
func main() {
	http.HandleFunc("/foo", logging(foo))
	http.HandleFunc("/bar", logging(bar))

	http.ListenAndServe(":8080", nil)
}
