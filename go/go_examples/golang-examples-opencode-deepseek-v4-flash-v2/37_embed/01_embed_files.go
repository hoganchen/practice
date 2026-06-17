// ============================================================================
// 知识点: embed 嵌入静态文件 (Go 1.16+)
//
// 说明:
// - //go:embed 指令将文件或目录嵌入到 Go 二进制文件中
// - 支持嵌入为 string, []byte 或 embed.FS 文件系统
// - embed.FS 实现了 io/fs 接口, 支持目录遍历
// - 编译后二进制独立运行, 无需外部文件
// - 常用于: 嵌入模板、静态文件、配置文件
//
// 编译和运行:
//   go run 37_embed\01_embed_files.go
// ============================================================================

package main

import (
	"embed"
	"fmt"
	"io/fs"
	"os"
)

//go:embed version.txt
var version string

//go:embed config.json
var configBytes []byte

//go:embed static/*
var staticFiles embed.FS

func main() {
	// 嵌入为字符串
	fmt.Println("版本:", version)

	// 嵌入为 []byte
	fmt.Println("配置文件:")
	fmt.Println(string(configBytes))

	// 嵌入文件系统
	fmt.Println("\n嵌入的文件系统 (static/):")
	entries, err := fs.ReadDir(staticFiles, "static")
	if err != nil {
		fmt.Println("读取嵌入目录失败:", err)
		os.Exit(1)
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			data, _ := staticFiles.ReadFile("static/" + entry.Name())
			fmt.Printf("  %s: %s", entry.Name(), string(data))
		}
	}
}
