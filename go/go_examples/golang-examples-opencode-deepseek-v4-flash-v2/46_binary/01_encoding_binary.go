// ============================================================================
// 知识点: encoding/binary 二进制编码
//
// 说明:
// - binary.Read / Write 用字节顺序(大端/小端)读写二进制数据
// - binary.Size 返回数据编码后的字节大小
// - LittleEndian (小端) / BigEndian (大端)
// - 常用于: 网络协议解析、文件格式读写、与 C 交互
// - 固定大小的结构体可以直接用 binary.Read/Write
//
// 编译和运行:
//   go run 46_binary\01_encoding_binary.go
// ============================================================================

package main

import (
	"bytes"
	"encoding/binary"
	"fmt"
)

type PacketHeader struct {
	Magic    uint16
	Version  uint8
	Flags    uint8
	Length   uint32
	Sequence uint64
}

func main() {
	// 编码 (序列化)
	header := PacketHeader{
		Magic:    0xABCD,
		Version:  1,
		Flags:    0x0F,
		Length:   1024,
		Sequence: 1234567890,
	}

	var buf bytes.Buffer
	err := binary.Write(&buf, binary.BigEndian, header)
	if err != nil {
		fmt.Println("编码失败:", err)
		return
	}

	fmt.Printf("编码后大小: %d 字节\n", buf.Len())
	fmt.Printf("hex: %X\n", buf.Bytes())

	// 解码 (反序列化)
	var decoded PacketHeader
	err = binary.Read(&buf, binary.BigEndian, &decoded)
	if err != nil {
		fmt.Println("解码失败:", err)
		return
	}
	fmt.Printf("\n解码结果:\n")
	fmt.Printf("  Magic: 0x%04X\n", decoded.Magic)
	fmt.Printf("  Version: %d\n", decoded.Version)
	fmt.Printf("  Flags: 0x%02X\n", decoded.Flags)
	fmt.Printf("  Length: %d\n", decoded.Length)
	fmt.Printf("  Sequence: %d\n", decoded.Sequence)

	// 小端 vs 大端
	value := uint32(0x01020304)
	var leBuf, beBuf bytes.Buffer
	binary.Write(&leBuf, binary.LittleEndian, value)
	binary.Write(&beBuf, binary.BigEndian, value)
	fmt.Printf("\nuint32 0x01020304 编码:\n")
	fmt.Printf("  LittleEndian: % X\n", leBuf.Bytes())
	fmt.Printf("  BigEndian:    % X\n", beBuf.Bytes())

	// 编码基本类型
	fmt.Println("\n基本类型编码:")
	var numBuf bytes.Buffer
	binary.Write(&numBuf, binary.LittleEndian, int32(-42))
	fmt.Printf("  int32(-42) LE: % X\n", numBuf.Bytes())
}
