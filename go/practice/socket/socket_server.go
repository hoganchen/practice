/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"net"
)

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	ln, err := net.Listen("tcp", ":8080")
    if err != nil {
        panic(err)
    }
    for {
        conn, err := ln.Accept()
        if err != nil {
            panic(err)
        }
        // 每个Client一个Goroutine
        go handleConnection(conn)
    }

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}

func handleConnection(conn net.Conn) {
    defer conn.Close()
    var body [4]byte
    addr := conn.RemoteAddr()
    for {
        // 读取客户端消息
        _, err := conn.Read(body[:])
        if err != nil {
            break
        }
        fmt.Printf("收到%s消息: %s\n", addr, string(body[:]))
        // 回包
        _, err = conn.Write(body[:])
        if err != nil {
            break
        }
        fmt.Printf("发送给%s: %s\n", addr, string(body[:]))
    }
    fmt.Printf("与%s断开!\n", addr)
}