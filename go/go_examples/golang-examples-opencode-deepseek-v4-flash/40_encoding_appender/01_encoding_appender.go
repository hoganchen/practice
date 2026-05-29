// ============================================================
// 知识点：encoding.TextAppender / BinaryAppender（Go 1.24+）
//
// Go 1.24 新增了 TextAppender 和 BinaryAppender 接口，
// 提供零分配的序列化方式。与 TextMarshaler/BinaryMarshaler 的区别：
//   传统方式：返回新切片（有分配）
//   新方式：追加到已有切片（零分配）
//
// 接口定义：
//   type TextAppender interface { AppendText([]byte) ([]byte, error) }
//   type BinaryAppender interface { AppendBinary([]byte) ([]byte, error) }
//
// time.Time 等标准库类型已实现这两个新接口。
//
// 编译运行方法：
//   go run 01_encoding_appender.go
// ============================================================

package main

import (
	"encoding"
	"fmt"
	"strconv"
	"time"
)

// -------- 自定义类型实现 TextAppender --------
type Point struct {
	X, Y int
}

// Point 实现 TextAppender 接口
// 返回格式 "(x,y)"
func (p Point) AppendText(b []byte) ([]byte, error) {
	b = append(b, '(')
	b = strconv.AppendInt(b, int64(p.X), 10)
	b = append(b, ',')
	b = strconv.AppendInt(b, int64(p.Y), 10)
	b = append(b, ')')
	return b, nil
}

// -------- 使用接口的通用函数 --------
func marshalText[T encoding.TextAppender](v T) (string, error) {
	// 从零长度 buf 开始，AppendText 会追加而不会分配
	var buf []byte
	var err error
	buf, err = v.AppendText(buf)
	if err != nil {
		return "", err
	}
	return string(buf), nil
}

func main() {
	// -------- time.Time 实现了 TextAppender --------
	fmt.Println("=== time.Time.AppendText ===")
	var buf []byte
	t := time.Now()
	buf, _ = t.AppendText(buf)
	fmt.Println("时间:", string(buf))

	// -------- time.Time 实现了 BinaryAppender --------
	fmt.Println("\n=== time.Time.AppendBinary ===")
	var binBuf []byte
	binBuf, _ = t.AppendBinary(binBuf)
	fmt.Printf("二进制: %x (长度 %d 字节)\n", binBuf, len(binBuf))

	// -------- 自定义类型实现 TextAppender --------
	fmt.Println("\n=== 自定义 Point 实现 TextAppender ===")
	str, err := marshalText(Point{X: 10, Y: 20})
	if err != nil {
		fmt.Println("错误:", err)
	} else {
		fmt.Println("Point 文本:", str)
	}

	// -------- 性能优势说明 --------
	fmt.Println("\n=== 性能优势 ===")
	fmt.Println("TextAppender vs TextMarshaler:")
	fmt.Println("  TextMarshaler: 每次 MarshalText() 分配新切片")
	fmt.Println("  TextAppender: 追加到已有切片，可复用缓冲区")
}
