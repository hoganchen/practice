/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"log"
	"time"
	"net/http"
)

func say_hello(writer http.ResponseWriter, request *http.Request) {
	fmt.Println(&request)
	go func() {
		for range time.Tick(time.Second) {
			fmt.Println("Current request is in progress")
		}
	}()
	time.Sleep(2 * time.Second)
	writer.Write([]byte("Hi"))
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	http.HandleFunc("/", say_hello) // 设置访问的路由
	log.Fatalln(http.ListenAndServe(":8080",nil))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
