// ============================================================================
// 知识点: init 函数
//
// 说明:
// - init 函数在包初始化时自动执行, 无需显式调用
// - 执行顺序: 导入包 -> 常量/变量声明 -> init 函数
// - 同一个包可以有多个 init 函数, 按文件名的字典序执行
// - init 函数没有参数和返回值
// - 常用于: 注册驱动、初始化配置、校验环境
//
// 编译和运行:
//   go run 06_functions\06_init_function.go
// ============================================================================

package main

import "fmt"

var initialized bool

func init() {
	fmt.Println("  [init #1] 初始化数据库连接...")
	initialized = true
}

func init() {
	fmt.Println("  [init #2] 加载配置文件...")
}

func init() {
	fmt.Println("  [init #3] 校验运行环境...")
}

func main() {
	if initialized {
		fmt.Println("[main] 系统已初始化完毕, 启动应用")
	} else {
		fmt.Println("[main] 系统未初始化")
	}
}
