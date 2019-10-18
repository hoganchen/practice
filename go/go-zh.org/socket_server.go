package main

import (
    "net"
    "fmt"
    "strings"
)

/*
这是一个tcp的服务器,主要处理来自客户的连接
主要功能如下:
1.客户端发来字母的时候,将其处理成大写返回给客户端
2.当客户端连接上的时候将客户端的ip地址打印在服务器上面
3.当客户端发来exit字段的时候,关闭这个连接
 */

func main() {
    //创建连接
    listener, err := net.Listen("tcp", ":8888")
    if err != nil {
        fmt.Println("net Listen err", err)
        return
    }
    defer listener.Close()
    //连接监听数据,由于可能有很多次客户端的请求,所以放在for循环中进行处理
    for {
        conn, err := listener.Accept()
        if err != nil {
            fmt.Println("listener.Accept err", err)
            return
        }
        //连接来的时候新开go程进行处理,
        go HandleConn(conn)
    }
}
func HandleConn(conn net.Conn) {
    defer conn.Close()
    //每次连接上之后,在服务器打印出连接的ip地址
    ipStr := conn.RemoteAddr().String()
    fmt.Println("ip:", ipStr, "已连接")
    //读取客户端的数据,并对数据进行处理
    buffer := make([]byte, 1024*4)
    for {
        n, err := conn.Read(buffer)
        if err != nil {
            fmt.Println("conn read err", err)
            return
        }
        //读取到数据之后,对数据进行处理,然后写会给客户端
        str := string(buffer[:n])
        fmt.Print("服务器接收到的数据是:", str, len(str))
        if str[:n-1] == "exit" {
            //结束当前的客户端连接
            fmt.Println("客户端:", ipStr, "断开连接")
            return
        }
        _, err = conn.Write([]byte(strings.ToUpper(str)))
        if err != nil {
            fmt.Println("conn write err ", err)
            return
        }
    }
}