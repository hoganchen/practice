// ============================================================================
// 知识点: TCP 服务器
//
// 说明:
// - net.Listen 监听 TCP 端口
// - listener.Accept() 接受客户端连接, 返回 conn
// - 每个连接通常在一个独立的 goroutine 中处理
// - conn.Read/Write 进行数据读写
// - 注意需要处理连接关闭和超时
//
// 编译和运行:
//   go run 16_networking\01_tcp_server.go
//   然后在另一个终端运行客户端: go run 16_networking\02_tcp_client.go
// ============================================================================

package main

import (
	"bufio"
	"fmt"
	"net"
)

func handleConnection(conn net.Conn) {
	defer conn.Close()
	fmt.Printf("客户端已连接: %s\n", conn.RemoteAddr())

	scanner := bufio.NewScanner(conn)
	for scanner.Scan() {
		text := scanner.Text()
		fmt.Printf("收到: %s\n", text)

		// 回复客户端
		response := fmt.Sprintf("服务器收到: %s\n", text)
		conn.Write([]byte(response))
	}
	fmt.Printf("客户端断开: %s\n", conn.RemoteAddr())
}

func main() {
	listener, err := net.Listen("tcp", ":8080")
	if err != nil {
		fmt.Println("启动服务器失败:", err)
		return
	}
	defer listener.Close()
	fmt.Println("TCP 服务器启动, 监听 :8080")

	for {
		conn, err := listener.Accept()
		if err != nil {
			fmt.Println("接受连接失败:", err)
			continue
		}
		go handleConnection(conn)
	}
}
