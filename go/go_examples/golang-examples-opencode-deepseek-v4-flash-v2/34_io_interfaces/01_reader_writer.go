// ============================================================================
// 知识点: io.Reader 和 io.Writer 接口
//
// 说明:
// - io.Reader: type Reader interface { Read(p []byte) (n int, err error) }
// - io.Writer: type Writer interface { Write(p []byte) (n int, err error) }
// - 这两个接口是 Go I/O 的核心抽象
// - 标准库大量实现了这两个接口 (文件、网络、压缩、加密等)
// - io.Copy 在 Reader 和 Writer 之间传输数据
// - 组合接口: io.ReadWriter, io.ReadCloser 等
//
// 编译和运行:
//   go run 34_io_interfaces\01_reader_writer.go
// ============================================================================

package main

import (
	"bytes"
	"fmt"
	"io"
	"strings"
)

// 自定义 Writer: 统计写入字节数
type CountingWriter struct {
	Writer io.Writer
	Count  int64
}

func (cw *CountingWriter) Write(p []byte) (int, error) {
	n, err := cw.Writer.Write(p)
	cw.Count += int64(n)
	return n, err
}

// 自定义 Reader: 限制读取次数
type LimitedReader struct {
	Reader    io.Reader
	Remaining int
}

func (lr *LimitedReader) Read(p []byte) (int, error) {
	if lr.Remaining <= 0 {
		return 0, io.EOF
	}
	if len(p) > lr.Remaining {
		p = p[:lr.Remaining]
	}
	n, err := lr.Reader.Read(p)
	lr.Remaining -= n
	return n, err
}

func main() {
	// 基础 Reader/Writer 使用
	data := "Hello, io.Reader and io.Writer!"

	// strings.Reader 实现了 io.Reader
	reader := strings.NewReader(data)

	// bytes.Buffer 实现了 io.Writer
	var buf bytes.Buffer

	// io.Copy: 从 Reader 拷贝到 Writer
	n, err := io.Copy(&buf, reader)
	if err != nil {
		fmt.Println("Copy 失败:", err)
		return
	}
	fmt.Printf("拷贝了 %d 字节: %s\n", n, buf.String())

	// 链式 Writer
	fmt.Println("\n链式 Writer (MultiWriter):")
	var buf1, buf2 bytes.Buffer
	mw := io.MultiWriter(&buf1, &buf2)
	mw.Write([]byte("写入多个 Writer"))
	fmt.Printf("  buf1: %s\n", buf1.String())
	fmt.Printf("  buf2: %s\n", buf2.String())

	// 自定义 CountingWriter
	fmt.Println("\n自定义 CountingWriter:")
	var buf3 bytes.Buffer
	cw := &CountingWriter{Writer: &buf3}
	cw.Write([]byte("Hello"))
	cw.Write([]byte(" World"))
	fmt.Printf("  写入: %s (计数: %d 字节)\n", buf3.String(), cw.Count)

	// 自定义 LimitedReader
	fmt.Println("\n自定义 LimitedReader:")
	longStr := "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	lr := &LimitedReader{
		Reader:    strings.NewReader(longStr),
		Remaining: 10, // 只读取前10个字节
	}
	limitedData, _ := io.ReadAll(lr)
	fmt.Printf("  读取: %s (限制10字节)\n", string(limitedData))

	// TeeReader: 同时读取并写入
	fmt.Println("\nTeeReader (读取同时写入):")
	var logBuf bytes.Buffer
	teeReader := io.TeeReader(
		strings.NewReader("TeeReader 数据"),
		&logBuf,
	)
	result, _ := io.ReadAll(teeReader)
	fmt.Printf("  读取: %s\n", string(result))
	fmt.Printf("  日志(Tee写入): %s\n", logBuf.String())
}
