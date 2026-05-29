// ============================================================
// 知识点：structs 包 — 结构体内存布局控制（Go 1.23+）
//
// structs 包定义了用于控制结构体类型属性的标记类型。
//
// structs.HostLayout 是一个标记类型：
//   嵌入到结构体中表示该结构体的内存布局与宿主平台一致。
//   当结构体通过指针传递给外部（C/汇编）API 时必须使用此标记，
//   否则 Go 编译器未来可能改变结构体字段的排列顺序。
//
// 编译运行方法：
//   go run 01_structs.go
// ============================================================

package main

import (
	"fmt"
	"structs"
	"unsafe"
)

// -------- 普通的 Go 结构体 --------
// Go 编译器可能重排字段以优化内存对齐
type GoLayout struct {
	B1 byte
	I1 int64
	B2 byte
	I2 int64
}

// -------- 使用 HostLayout 标记的结构体 --------
// _ structs.HostLayout 是一个零大小的标记字段
// 它告诉编译器保持字段的声明顺序
type HostLayout struct {
	_  structs.HostLayout // 嵌入标记，必须是第一个字段
	B1 byte
	I1 int64
	B2 byte
	I2 int64
}

func main() {
	fmt.Println("=== structs.HostLayout 内存布局 ===")

	// 普通 Go 结构体：编译器可能优化对齐
	g := GoLayout{}
	fmt.Printf("GoLayout 大小: %d 字节\n", unsafe.Sizeof(g))
	fmt.Printf("  B1 偏移: %d\n", unsafe.Offsetof(g.B1))
	fmt.Printf("  I1 偏移: %d (可能已对齐到 8)\n", unsafe.Offsetof(g.I1))
	fmt.Printf("  B2 偏移: %d\n", unsafe.Offsetof(g.B2))
	fmt.Printf("  I2 偏移: %d\n", unsafe.Offsetof(g.I2))

	// HostLayout：严格按声明顺序布局
	h := HostLayout{}
	fmt.Printf("\nHostLayout 大小: %d 字节\n", unsafe.Sizeof(h))
	fmt.Printf("  B1 偏移: %d\n", unsafe.Offsetof(h.B1))
	fmt.Printf("  I1 偏移: %d (严格按声明顺序)\n", unsafe.Offsetof(h.I1))
	fmt.Printf("  B2 偏移: %d\n", unsafe.Offsetof(h.B2))
	fmt.Printf("  I2 偏移: %d\n", unsafe.Offsetof(h.I2))

	fmt.Println("\n注：HostLayout 在通过 unsafe 指针或 cgo 与外部交互时至关重要。")
	fmt.Println("它确保结构体在 Go 和宿主平台之间的内存布局一致。")
}
