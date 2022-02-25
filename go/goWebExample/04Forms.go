// forms.go
package main

import (
	"html/template"
	"net/http"
)

type ContactDetails struct {
	Email   string
	Subject string
	Message string
}

/*
这个例子将演示如何模拟联系人表单并将其解析到结构体中.
*/
// http://books.studygolang.com/gowebexamples/forms/
func main() {
	tmpl := template.Must(template.ParseFiles("forms.html"))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			tmpl.Execute(w, nil)
			return
		}

		details := ContactDetails{
			Email:   r.FormValue("email"),
			Subject: r.FormValue("subject"),
			Message: r.FormValue("message"),
		}

		// do something with details
		_ = details

		tmpl.Execute(w, struct{ Success bool }{true})
	})

	http.ListenAndServe(":8080", nil)
}
