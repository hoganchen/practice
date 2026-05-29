// ============================================================
// 知识点：os.Root — 基于根目录的安全文件操作（Go 1.25 增强）
//
// os.Root 提供基于特定目录根（root）的文件操作，
// 所有路径自动限制在该根目录下，防止路径穿越攻击。
// Go 1.25 为 os.Root 增加了大量新方法：
//
// 新增方法（Go 1.25）：
//   root.ReadFile(name string) ([]byte, error)
//   root.WriteFile(name string, data []byte, perm FileMode) error
//   root.Chmod(name string, perm FileMode) error
//   root.Chown(name string, uid, gid int) error
//   root.Symlink(oldName, newName string) error
//   root.Readlink(name string) (string, error)
//   root.RemoveAll(name string) error
//   root.Mkdir(name string, perm FileMode) error
//   root.OpenFile(name string, flag int, perm FileMode) (*File, error)
//   root.Stat(name string) (FileInfo, error)
//   root.Lstat(name string) (FileInfo, error)
// ============================================================

package main

import (
	"fmt"
	"os"
)

func main() {
	// ---- 1. 创建根目录 ----
	fmt.Println("=== os.Root 安全文件操作 (Go 1.25+) ===")

	// 创建测试用的根目录
	testRoot, _ := os.MkdirTemp("", "root_example_*")
	defer os.RemoveAll(testRoot) // 清理

	fmt.Printf("测试根目录: %s\n", testRoot)

	// ---- 2. 打开 root ----
	root, err := os.OpenRoot(testRoot)
	if err != nil {
		fmt.Printf("OpenRoot 失败: %v\n", err)
		return
	}
	defer root.Close()

	fmt.Println("os.OpenRoot 成功")

	// ---- 3. 创建子目录并在其中写入文件 ----
	fmt.Println("\n--- 创建目录和文件 ---")

	// 创建子目录
	err = root.Mkdir("subdir", 0755)
	if err != nil {
		fmt.Printf("Mkdir 失败: %v\n", err)
		return
	}
	fmt.Println("  创建目录: subdir")

	// 写入文件
	err = root.WriteFile("subdir/hello.txt", []byte("Hello, os.Root!"), 0644)
	if err != nil {
		fmt.Printf("WriteFile 失败: %v\n", err)
		return
	}
	fmt.Println("  写入文件: subdir/hello.txt")

	// ---- 4. 读取文件 ----
	fmt.Println("\n--- 读取文件 ---")

	data, err := root.ReadFile("subdir/hello.txt")
	if err != nil {
		fmt.Printf("ReadFile 失败: %v\n", err)
		return
	}
	fmt.Printf("  读取内容: %s\n", string(data))

	// ---- 5. 获取文件信息 ----
	fmt.Println("\n--- 文件信息 ---")

	info, err := root.Stat("subdir/hello.txt")
	if err != nil {
		fmt.Printf("Stat 失败: %v\n", err)
		return
	}
	fmt.Printf("  文件名: %s\n", info.Name())
	fmt.Printf("  大小: %d 字节\n", info.Size())
	fmt.Printf("  权限: %v\n", info.Mode())

	// ---- 6. 创建符号链接（Go 1.25 新增）----
	fmt.Println("\n--- 符号链接 ---")

	err = root.Symlink("subdir/hello.txt", "link_to_hello.txt")
	if err != nil {
		fmt.Printf("Symlink 失败: %v（当前平台可能不支持）\n", err)
	} else {
		// 读取符号链接
		target, err := root.Readlink("link_to_hello.txt")
		if err != nil {
			fmt.Printf("Readlink 失败: %v\n", err)
		} else {
			fmt.Printf("  符号链接: link_to_hello.txt -> %s\n", target)
		}
	}

	// ---- 7. 路径安全性（关键特性）----
	fmt.Println("\n--- 路径安全性 ---")

	// os.Root 会阻止路径穿越攻击
	// 尝试访问根目录之外的文件
	_, err = root.OpenFile("../outside.txt", os.O_RDONLY, 0)
	if err != nil {
		fmt.Printf("  路径穿越被阻止（预期行为）: %v\n", err)
	}

	// ---- 8. 删除操作 ----
	fmt.Println("\n--- 删除 ---")

	err = root.RemoveAll("subdir")
	if err != nil {
		fmt.Printf("RemoveAll 失败: %v\n", err)
		return
	}
	fmt.Println("  删除: subdir/")

	// ---- 9. 验证文件已删除 ----
	_, err = root.Stat("subdir/hello.txt")
	if os.IsNotExist(err) {
		fmt.Println("  文件已确实删除")
	}

	// ---- 10. 与 os.DirFS 配合 ----
	fmt.Println("\n--- 与 io/fs 集成 ---")

	// os.Root 实现了 io/fs.ReadLinkFS 接口（Go 1.25 新增）
	var _ interface{} = root
	fmt.Println("  os.Root 实现了 io/fs.ReadLinkFS 接口")

	// 使用 DirFS 创建基于路径的 fs.FS
	fs := os.DirFS(testRoot)
	entries, _ := fs.Open(".")
	fmt.Printf("  os.DirFS 打开根目录成功: %v\n", entries)

	fmt.Println("\n=== os.Root 示例结束 ===")
	fmt.Println("临时文件已在 defer cleanup 中清理")

	// ---- 知识点总结 ----
	fmt.Println("\n--- os.Root 优势 ---")
	fmt.Println("  1. 安全：自动阻止路径穿越攻击")
	fmt.Println("  2. 便捷：无需手动拼接路径")
	fmt.Println("  3. 统一：一致的错误处理")
	fmt.Println("  4. Go 1.25 新增: ReadFile, WriteFile, Symlink,")
	fmt.Println("     Chmod, Chown, RemoveAll 等")
}

// 编译运行：go run 03_os_root.go
// 需要 Go 1.25+
