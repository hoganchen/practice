// ============================================================================
// 知识点: TCP 客户端
//
// 说明:
// - net.Dial 建立到服务器的 TCP 连接
// - conn.Write 发送数据
// - bufio.Scanner 或 conn.Read 读取响应
// - 连接使用完毕后需要 Close
//
// 编译和运行:
//   go run 16_networking\02_tcp_client.go
//   需要先启动 TCP 服务器: go run 16_networking\01_tcp_server.go
// ============================================================================

package main

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"strings"
)

func main() {
	conn, err := net.Dial("tcp", "127.0.0.1:8080")
	if err != nil {
		fmt.Println("连接服务器失败:", err)
		return
	}
	defer conn.Close()
	fmt.Println("已连接到服务器 (输入 'quit' 退出)")

	reader := bufio.NewReader(os.Stdin)
	serverReader := bufio.NewReader(conn)

	for {
		fmt.Print("> ")
		text, _ := reader.ReadString('\n')
		text = strings.TrimSpace(text)

		if text == "quit" {
			break
		}

		// 发送到服务器
		fmt.Fprintf(conn, "%s\n", text)

		// 读取服务器响应
		response, _ := serverReader.ReadString('\n')
		fmt.Println("响应:", strings.TrimSpace(response))
	}
	fmt.Println("连接关闭")
}
