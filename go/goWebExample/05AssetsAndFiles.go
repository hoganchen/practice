// static-files.go
package main

import "net/http"

/*
这个例子将展示如何使用静态文件比如CSS、 JavaScripts或图片.
*/
// http://books.studygolang.com/gowebexamples/static-files/
func main() {
	fs := http.FileServer(http.Dir("assets/"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	http.ListenAndServe(":8080", nil)
}
