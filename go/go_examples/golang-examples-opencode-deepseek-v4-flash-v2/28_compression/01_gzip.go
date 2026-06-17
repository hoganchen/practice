// ============================================================================
// 知识点: gzip 压缩与解压
//
// 说明:
// - compress/gzip 实现 GZip 格式的压缩和解压
// - gzip.NewWriter 创建压缩写入器
// - gzip.NewReader 创建解压读取器
// - 常用于 HTTP 传输压缩、日志文件归档
// - 总是调用 Close() 确保数据完全写入
//
// 编译和运行:
//   go run 28_compression\01_gzip.go
// ============================================================================

package main

import (
	"bytes"
	"compress/gzip"
	"fmt"
	"io"
)

func main() {
	original := "这是需要压缩的数据。Go语言中的gzip压缩使用方便。" +
		"重复的内容可以更好地展示压缩效果。" +
		"重复的内容可以更好地展示压缩效果。" +
		"重复的内容可以更好地展示压缩效果。"

	// 压缩
	var buf bytes.Buffer
	gzWriter := gzip.NewWriter(&buf)
	gzWriter.Write([]byte(original))
	gzWriter.Close()

	compressed := buf.Bytes()
	fmt.Printf("原始大小: %d 字节\n", len(original))
	fmt.Printf("压缩后大小: %d 字节\n", len(compressed))
	fmt.Printf("压缩比: %.1f%%\n", float64(len(compressed))/float64(len(original))*100)

	// 解压
	gzReader, err := gzip.NewReader(&buf)
	if err != nil {
		fmt.Println("创建解压器失败:", err)
		return
	}
	defer gzReader.Close()

	decompressed, err := io.ReadAll(gzReader)
	if err != nil {
		fmt.Println("解压失败:", err)
		return
	}

	fmt.Printf("解压后数据: %s\n", string(decompressed))
	fmt.Println("数据一致:", string(decompressed) == original)
}
