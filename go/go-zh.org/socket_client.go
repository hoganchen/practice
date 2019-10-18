package main

import (
    "fmt"
    "net"
    "bufio"
    "os"
    "io"
)

/*
这是一个和远程主机连接的客户端
要实现的功能是:
1.主动的请求服务器,与服务器建立连接
2.接收键盘输入,保存输入的字符串并写入服务器
*/

func main() {
    //远程拨号,请求连接
    conn, err := net.Dial("tcp", ":8888")
    if err != nil {
        fmt.Println("net dial err is ", err)
        return
    }

    //此外,还要监听来自服务器返回的数据,如果返回数据的话,打印在屏幕上
    data := make([]byte, 1024*4)
    go func() {
        //准备写入数据
        for {
            in := bufio.NewReader(os.Stdin)
            result, err := in.ReadString('\n')
            if err != nil {
                fmt.Println("输入有误,请重新输入!")
                continue
            }
            //这里可以将得到的字符串转换成字符切片写给服务器
            buffer := []byte(result)
            _, err = conn.Write(buffer)
            if err != nil {
                fmt.Println("conn write err ", err)
                continue
            }
        }
    }()
    for {
        n, err := conn.Read(data)
        if err != nil {
            if err == io.EOF{
                fmt.Println("客户端断开连接")
                break
            }
            fmt.Println("conn read err is ", err)
            break
        }
        //从服务器读取到数据之后,打印
        fmt.Print("data from server is ", string(data[:n]))
    }

}
