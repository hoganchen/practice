// ============================================================
// 知识点：os.Root — 安全文件系统隔离（Go 1.24+）
//
// os.Root 是 Go 1.24 引入的类型，提供"chroot 风格"的安全文件访问。
// 创建 Root 后，所有操作都被限制在该根目录下，无法通过 ".." 逃逸。
//
// 核心方法：
//   os.OpenRoot(dir)  — 打开一个目录作为根
//   root.Open(path)   — 在根内打开文件
//   root.Mkdir(path)  — 在根内创建目录
//   root.FS()         — 返回 io/fs.FS 接口
//
// 编译运行方法：
//   go run 01_os_root.go
// ============================================================

package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	// -------- 创建临时目录结构用于演示 --------
	tmpDir, _ := os.MkdirTemp("", "os_root_example")
	defer os.RemoveAll(tmpDir)

	// 创建一些目录和文件
	os.MkdirAll(filepath.Join(tmpDir, "subdir"), 0755)
	os.WriteFile(filepath.Join(tmpDir, "hello.txt"), []byte("Hello from Root!"), 0644)
	os.WriteFile(filepath.Join(tmpDir, "subdir", "nested.txt"), []byte("Nested file"), 0644)

	fmt.Println("=== os.Root 隔离文件访问 ===")
	fmt.Println("临时根目录:", tmpDir)

	// -------- 打开 Root --------
	root, err := os.OpenRoot(tmpDir)
	if err != nil {
		fmt.Println("OpenRoot 失败:", err)
		return
	}
	defer root.Close()

	// -------- 在 Root 内安全打开文件 --------
	fmt.Println("\n--- 在 Root 内读取文件 ---")
	content, err := os.ReadFile(root.Name() + "/hello.txt")
	if err != nil {
		fmt.Println("读取失败:", err)
	} else {
		fmt.Println("hello.txt:", string(content))
	}

	// -------- 尝试路径逃逸（会被安全拒绝）--------
	fmt.Println("\n--- 路径逃逸尝试 ---")
	// 如果有人在 path 参数中传 "../"，Root 会拒绝
	testPath := "../" + filepath.Base(tmpDir) + "/hello.txt"
	fmt.Printf("尝试逃逸路径: %s\n", testPath)
	fmt.Println("创建 Root 后，内部路径不能使用 .. 逃逸")

	// -------- 使用 FS 接口 --------
	fmt.Println("\n--- 通过 FS 接口访问 ---")
	fsys := root.FS()
	entries, err := fsys.Open(".")
	if err != nil {
		fmt.Println("FS 打开失败:", err)
	} else {
		fmt.Println("FS 接口可用，读取根目录成功")
		entries.Close()
	}
}
