// ============================================================================
// 知识点: 环境变量操作
//
// 说明:
// - os.Getenv 获取环境变量值, 不存在返回空字符串
// - os.LookupEnv 获取环境变量, 额外返回是否存在
// - os.Setenv 设置环境变量 (仅影响当前进程)
// - os.Environ 获取所有环境变量
// - os.ExpandEnv 替换字符串中的 ${var} 或 $var
//
// 编译和运行:
//   go run 18_os_operations\01_env_vars.go
// ============================================================================

package main

import (
	"fmt"
	"os"
)

func main() {
	// 设置环境变量 (仅当前进程有效)
	os.Setenv("APP_NAME", "GoExample")
	os.Setenv("APP_VERSION", "1.0.0")

	// 获取环境变量
	name := os.Getenv("APP_NAME")
	fmt.Println("APP_NAME:", name)

	// LookupEnv 检查变量是否存在
	version, exists := os.LookupEnv("APP_VERSION")
	if exists {
		fmt.Println("APP_VERSION:", version)
	}

	// 获取不存在的变量
	db := os.Getenv("DATABASE_URL")
	if db == "" {
		fmt.Println("DATABASE_URL 未设置, 使用默认值")
		db = "localhost:5432"
	}
	fmt.Println("数据库地址:", db)

	// 环境变量替换
	message := os.ExpandEnv("应用: ${APP_NAME}, 版本: $APP_VERSION")
	fmt.Println(message)

	// 列出部分环境变量
	home := os.Getenv("HOME")
	path := os.Getenv("PATH")
	fmt.Println("HOME:", home)
	fmt.Println("PATH[:50]:", path[:min(50, len(path))]+"...")
}
