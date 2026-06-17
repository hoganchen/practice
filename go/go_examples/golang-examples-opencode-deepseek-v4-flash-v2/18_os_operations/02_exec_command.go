// ============================================================================
// 知识点: 执行系统命令 (os/exec)
//
// 说明:
// - exec.Command 创建外部命令调用
// - cmd.Output() 运行命令并捕获标准输出
// - cmd.Run() 运行命令等待完成
// - cmd.Stdin/stdout/stderr 可以连接到 io.Reader/Writer
// - 支持管道和重定向
//
// 编译和运行:
//   go run 18_os_operations\02_exec_command.go
// ============================================================================

package main

import (
	"fmt"
	"os/exec"
	"runtime"
	"strings"
)

func main() {
	var cmd *exec.Cmd

	if runtime.GOOS == "windows" {
		cmd = exec.Command("cmd", "/c", "echo Hello from CMD & ver")
	} else {
		cmd = exec.Command("sh", "-c", "echo 'Hello from Shell' && uname -a")
	}

	output, err := cmd.Output()
	if err != nil {
		fmt.Println("执行命令失败:", err)
		return
	}

	fmt.Println("命令输出:")
	fmt.Println(string(output))

	// 带参数的命令
	fmt.Println("--- 当前目录文件列表 ---")
	var lsCmd *exec.Cmd
	if runtime.GOOS == "windows" {
		lsCmd = exec.Command("cmd", "/c", "dir /b")
	} else {
		lsCmd = exec.Command("ls", "-la")
	}
	lsOut, _ := lsCmd.Output()
	fmt.Println(strings.TrimSpace(string(lsOut)))
}
