// ============================================================================
// 知识点: archive/zip 创建与读取 ZIP 档案
//
// 说明:
// - archive/zip 提供 ZIP 格式的读写
// - zip.NewWriter 创建 ZIP 文件, zip.NewReader 读取
// - 支持添加文件、目录、设置压缩方法
// - zip.File 包含文件头信息 (名称、大小、修改时间等)
//
// 编译和运行:
//   go run 42_archive\01_zip_create.go
// ============================================================================

package main

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"os"
	"time"
)

func main() {
	// 创建 ZIP
	var buf bytes.Buffer
	zipWriter := zip.NewWriter(&buf)

	// 添加文件1
	f1, _ := zipWriter.Create("hello.txt")
	f1.Write([]byte("Hello, ZIP!"))

	// 添加文件2 (目录)
	f2, _ := zipWriter.Create("subdir/config.json")
	f2.Write([]byte(`{"version": "1.0"}`))

	// 添加带文件头的文件
	f3, _ := zipWriter.CreateHeader(&zip.FileHeader{
		Name:     "notes.md",
		Method:   zip.Deflate,
		Comment:  "这是注释",
	})
	f3.Write([]byte("# Notes\n\nThis is a note."))

	zipWriter.Close()
	fmt.Printf("ZIP 大小: %d 字节\n", buf.Len())

	// 保存到文件
	os.WriteFile("example.zip", buf.Bytes(), 0644)
	defer os.Remove("example.zip")

	// 读取 ZIP
	zipReader, _ := zip.NewReader(bytes.NewReader(buf.Bytes()), int64(buf.Len()))

	fmt.Println("\nZIP 内容:")
	for _, f := range zipReader.File {
		fmt.Printf("  %s (大小: %d, 压缩率: %.0f%%, 方法: %s)\n",
			f.Name,
			f.UncompressedSize64,
			float64(f.CompressedSize64)/float64(f.UncompressedSize64)*100,
			func() string {
				if f.Method == zip.Deflate { return "Deflate" }
				return "Store"
			}(),
		)

		rc, _ := f.Open()
		content, _ := io.ReadAll(rc)
		rc.Close()
		fmt.Printf("    内容: %s\n", string(content))
	}

	// 等待文件写入
	time.Sleep(10 * time.Millisecond)
}
