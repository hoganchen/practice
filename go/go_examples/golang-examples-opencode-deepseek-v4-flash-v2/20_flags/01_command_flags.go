// ============================================================================
// 知识点: flag 包 - 命令行参数解析
//
// 说明:
// - flag 包用于解析命令行参数
// - flag.Type 注册参数: flag.String, flag.Int, flag.Bool 等
// - flag.Parse() 解析命令行参数
// - 支持 -name value, -name=value, --name value 格式
// - flag.Args() 获取非选项参数
//
// 编译和运行:
//   go run 20_flags\01_command_flags.go -name Alice -count 3 -verbose
//   go run 20_flags\01_command_flags.go --help
// ============================================================================

package main

import (
	"flag"
	"fmt"
)

func main() {
	// 定义命令行参数
	name := flag.String("name", "World", "要问候的名称")
	count := flag.Int("count", 1, "重复次数")
	verbose := flag.Bool("verbose", false, "启用详细输出")
	config := flag.String("config", "", "配置文件路径")

	// 解析命令行参数
	flag.Parse()

	if *verbose {
		fmt.Println("详细模式已启用")
		fmt.Printf("配置: %s\n", *config)
		fmt.Printf("非选项参数: %v\n", flag.Args())
		fmt.Println("---")
	}

	for i := 0; i < *count; i++ {
		fmt.Printf("你好, %s!\n", *name)
	}
}
