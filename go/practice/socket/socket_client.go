/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"net"
	"sync"
	"math/rand"
)

var wg sync.WaitGroup //定义一个同步等待的组

func connect_server() {
	var msg = []byte("abcd")

    conn, err := net.Dial("tcp", "127.0.0.1:8080")
    if err != nil {
        panic(err)
	}

	for i := 0; i < 10; i++ {
		// 发送消息
		_, err = conn.Write([]byte(msg))
		if err != nil {
			panic(err)
		}
		fmt.Println("发送消息: " + string(msg))

		// 读取消息
		_, err = conn.Read(msg[:])
		if err != nil {
			panic(err)
		}
		fmt.Println("收到消息: " + string(msg))

		time.Sleep(time.Duration(rand.Intn(10)) * time.Second)
	}

	wg.Done() //减去一个计数
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	for i := 0; i < 10; i++ {
		wg.Add(1) //添加一个计数
		go connect_server()
	}

	wg.Wait() //阻塞直到所有任务完成

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
