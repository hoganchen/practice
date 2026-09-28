// ============================================================================
// 知识点: 切片传参与改写
//
// 说明:
// - Go 只有值传递: 传切片时复制的是切片头 {ptr, len, cap}, 底层数组不复制
// - 所以切片不是"引用传递", 而是"值传递 + 共享底层数组"
// - 改元素(s[i]=x / copy) 能改到调用方; 改切片头(append 扩容 / 重切) 改不到
// - 想真正改写调用方的切片头, 只有三条路:
//   A. 传切片指针 *[]T    B. 返回新切片由调用方接收    C. 调用方预留长度, 函数内只 copy
// - 命名类型的方法同理: 值接收者改不了切片头, 必须用指针接收者
// - 写法 A 与 B 的性能差异可忽略, 且快慢方向取决于函数是否被内联, 见文末结论
//
// 编译和运行:
//   go run 05_collections\04_slice_pass.go
// ============================================================================

package main

import "fmt"

// ---------- 情况 1: 改元素 -> 能改到调用方 ----------
// 参数 s 是切片头的副本, 但 ptr 和调用方指向同一个底层数组, 写 s[i] 就是写原数组
func setFirst(s []int) { s[0] = 100 }

// ---------- 情况 2: append 不扩容 -> 数据写进去了, 但调用方看不见 ----------
// append 返回了新的切片头(len+1), 这里只赋给局部变量 s, 函数返回后就被丢弃
// 调用方的 len 没变, 所以通过原切片看不到 999 -- 但它确实已写进共享数组
func appendInPlace(s []int) { s = append(s, 999) }

// ---------- 情况 3: append 扩容 -> 连底层数组都不共享了 ----------
func appendGrow(s []int) { s = append(s, 999) }

// ---------- 情况 4: 改切片头 -> 必须让调用方拿到新的头 ----------
// 写法 A: 传切片指针, 通过 *s 改写调用方的切片头
func appendViaPtr(s *[]int) { *s = append(*s, 999) }

// 写法 B: 返回新切片, 由调用方赋值接收 (Go 官方风格, 如 append / slices.Delete)
func appendReturn(s []int) []int { return append(s, 999) }

// 写法 C: 长度由调用方预先准备好, 函数内只 copy 元素, 完全不碰 len (零分配)
// 这是标准库最常见的形态: io.Reader.Read(buf) 就是往调用方给的 buf 里填数据,
// 返回实际写入了几个字节, 而 buf 的长度由调用方决定, Read 从不修改它
func fill(s []int) { copy(s, []int{7, 8, 9}) }

// ---------- 命名类型的方法: 值接收者同样改不了切片头 ----------
type IntSlice []int

func (s IntSlice) BadAppend(v int) { s = append(s, v) } // 改的是副本, 无效

func (s *IntSlice) GoodAppend(v int) { *s = append(*s, v) } // 指针接收者才有效

func main() {
	// 情况 1: 改元素
	a := []int{1, 2, 3}
	setFirst(a)
	fmt.Println("情况1  改元素      :", a, "<- 改到了")

	// 情况 2: append 但是 cap 够用
	b := make([]int, 2, 5)
	b[0], b[1] = 1, 2
	appendInPlace(b)
	fmt.Println("情况2  原地 append :", b, "len:", len(b), "<- 看不见 999")
	fmt.Println("       拉到 cap 才看:", b[:cap(b)]) // 999 确实占了尾部空闲区

	// 情况 3: append 触发扩容
	c := []int{1, 2, 3} // 字面量的 cap == len == 3, 必然扩容
	appendGrow(c)
	fmt.Println("情况3  扩容 append :", c, "<- 完全没变")

	// 情况 4 写法 A: 指针
	viaPtr := []int{1, 2, 3}
	appendViaPtr(&viaPtr)
	fmt.Println("情况4A 指针 *[]int :", viaPtr, "<- 改写了")

	// 情况 4 写法 B: 返回值接收
	viaRet := []int{1, 2, 3}
	viaRet = appendReturn(viaRet)
	fmt.Println("情况4B 返回值接收  :", viaRet, "<- 改写了")

	// 情况 4 写法 C: 调用方给足 len, 函数内 copy
	dst := make([]int, 3) // 长度必须由调用方准备
	fill(dst)
	fmt.Println("情况4C copy 填充   :", dst, "<- 改写了元素")

	// 命名类型的方法
	var is IntSlice = []int{1, 2, 3}
	is.BadAppend(9)
	fmt.Println("值接收者方法       :", is, "<- append 丢了")
	is.GoodAppend(9)
	fmt.Println("指针接收者方法     :", is, "<- 改写了")

	// 结论: 函数内对参数切片 append 后只赋给局部变量, 是毫无意义的写法
	//   要么 *s = append(*s, ...), 要么 return append(s, ...)
	//   要么在注释里说明"本函数只改元素, 不改长度"
	// 补充: 情况 2 那种"数据已写入但调用方看不见"的状态最危险 --
	//   调用方之后自己 append 时会正好覆盖这个位置, 见 02_slice.go 的别名陷阱

	// ---------- 结论: 写法 A(指针) 和写法 B(返回值) 的性能够不够看? ----------
	// 实测 (append 1 个 int, 内层循环 100 次, 16 核 / go1.25, 多次运行):
	//   A 传指针   允许内联 46-57 ns/op  |  禁止内联  92-123 ns/op
	//   B 返回值   允许内联 35-40 ns/op  |  禁止内联 100-115 ns/op
	//   堆分配: 四组全是 0 B/op, 0 allocs/op -- 传指针不会让切片头逃逸到堆上
	// 内联时 B 稳定快约 30%: A 要取 &s, 切片头被迫驻留栈内存, 内层循环每轮
	//   多出 3 次栈读 + 1 次栈写; B 的切片头全程在寄存器里。
	//   而这开销只在函数小到会被内联时才显著 -- 小函数恰恰就会被内联
	// 禁止内联时两组差异在 10% 以内, 但方向不可复现: benchstat -count=20
	//   单次运行给出 "A 快 7.7% (p=0.000)", 换个时间再跑却测到 "B 快 18%" --
	//   存在运行间系统性偏移, 运行内置信区间盖不住, 跨运行结论不可依赖
	// 所以: 不要为这点纳秒选 API, 按语义选写法 B (与 append / slices.* 一致)
	// 完整基准测试与数据: 29_testing/04_bench_slice_pass_test.go
}
