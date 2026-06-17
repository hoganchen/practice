// ============================================================================
// 知识点: path/filepath 路径操作
//
// 说明:
// - filepath 包提供跨平台的文件路径操作 (Windows用\，Unix用/)
// - filepath.Join 智能拼接路径
// - filepath.Dir / Base / Ext 获取路径的各个部分
// - filepath.Walk / WalkDir 遍历目录树
// - filepath.Glob 模式匹配文件
// - filepath.Abs 获取绝对路径
//
// 编译和运行:
//   go run 18_os_operations\03_filepath.go
// ============================================================================

package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	// 路径拼接 (自动处理分隔符)
	p := filepath.Join("app", "config", "settings.json")
	fmt.Println("Join:", p)

	// 路径分解
	fullPath, _ := filepath.Abs("./main.go")
	fmt.Println("Abs:", fullPath)
	fmt.Println("Dir:", filepath.Dir(fullPath))
	fmt.Println("Base:", filepath.Base(fullPath))
	fmt.Println("Ext:", filepath.Ext(fullPath))

	// 通配符匹配
	matches, _ := filepath.Glob("*.go")
	fmt.Println("\n当前目录 .go 文件:", matches)

	// 遍历目录
	fmt.Println("遍历当前目录:")
	filepath.WalkDir(".", func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() && path != "." {
			fmt.Printf("  [目录] %s\n", path)
			return filepath.SkipDir
		}
		if filepath.Ext(path) == ".go" {
			fmt.Printf("  [文件] %s (%d bytes)\n", path, func() int64 {
				info, _ := d.Info()
				return info.Size()
			}())
		}
		return nil
	})
}
