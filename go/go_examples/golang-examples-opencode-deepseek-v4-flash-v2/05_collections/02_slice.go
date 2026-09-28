// ============================================================================
// 知识点: 切片 (Slice)
//
// 说明:
// - 切片是动态数组, 是对底层数组的抽象和封装
// - 创建方式: make([]类型, 长度, 容量), 字面量, 从数组截取
// - 切片是引用类型, 包含指针、长度、容量三个字段
// - append 函数用于向切片追加元素, 容量不足时自动扩容
// - 截取语法: s[low:high] 左闭右开
// - nil 切片的长度和容量都为0, 与空切片 []T{} 的差异见下方对比
// - 切片是"视图": 赋值只复制切片头, 多个切片可能共享同一底层数组
// - 切片作为函数参数时如何改写原切片, 详见 04_slice_pass.go
//
// 编译和运行:
//   go run 05_collections\02_slice.go
// ============================================================================

package main

import "fmt"

func main() {
	// 创建切片
	s1 := []int{1, 2, 3, 4, 5}
	s2 := make([]string, 3, 5) // len=3, cap=5

	fmt.Println("s1:", s1, "len:", len(s1), "cap:", cap(s1))
	fmt.Println("s2:", s2, "len:", len(s2), "cap:", cap(s2))

	// 从数组截取
	arr := [5]int{10, 20, 30, 40, 50}
	s3 := arr[1:4] // [20, 30, 40]
	fmt.Println("arr[1:4]:", s3)

	// append 追加
	s4 := []int{1, 2, 3}
	s4 = append(s4, 4, 5, 6)
	s4 = append(s4, []int{7, 8, 9}...)
	fmt.Println("append 后:", s4)

	// 切片扩容机制
	s5 := make([]int, 0, 2)
	fmt.Printf("cap=%d\n", cap(s5))
	for i := 0; i < 10; i++ {
		s5 = append(s5, i)
		if cap(s5) != cap(s5)-1 && i < 3 || i%3 == 0 {
			fmt.Printf("  append %d: len=%d cap=%d\n", i, len(s5), cap(s5))
		}
	}

	// nil 切片
	var s6 []int
	fmt.Println("nil 切片:", s6, "len:", len(s6), "cap:", cap(s6), "is nil:", s6 == nil)

	// ---------- nil 切片 vs 空切片 ----------
	// 打印结果完全一样 (都是 []), len/cap 都是 0, 区别只在"底层指针是不是 nil"
	var s7 []int         // nil 切片:  底层指针为 nil
	s8 := []int{}        // 空切片:    指针非 nil, 指向 runtime.zerobase
	s9 := make([]int, 0) // 空切片:    len=cap=0 但指针非 nil
	fmt.Printf("nil 切片  : %v len=%d cap=%d is nil=%v\n", s7, len(s7), cap(s7), s7 == nil)
	fmt.Printf("空切片 {} : %v len=%d cap=%d is nil=%v\n", s8, len(s8), cap(s8), s8 == nil)
	fmt.Printf("make(,0)  : %v len=%d cap=%d is nil=%v\n", s9, len(s9), cap(s9), s9 == nil)

	// 相同点: len/cap/range/append 对 nil 切片都是安全的, 不会 panic
	count := 0
	for range s7 {
		count++
	}
	fmt.Println("  range nil 切片次数:", count)
	fmt.Println("  append 到 nil 切片:", append(s7, 1, 2), " 原切片仍是:", s7)

	// 坑 1: 判断"有没有元素"要用 len(s) == 0, 千万不要用 s == nil
	//       调用方可能传进来一个空切片, s == nil 会漏判
	// 坑 2: nil 切片装进 interface/any 之后, 接口本身并不是 nil
	var boxed any = s7
	fmt.Println("  nil 切片装入 any 后 boxed == nil ?", boxed == nil) // false
	// 坑 3: JSON 序列化结果不同: nil 切片 -> null, 空切片 -> []
	//       默认用 nil 切片(它才是切片的零值); 只有 JSON 契约要求 [] 时才写 []T{}
	//       详见 14_file_io/03_json_marshal.go

	// ---------- 切片别名: 赋值只复制切片头 ----------
	base := []int{1, 2, 3}                                       // 字面量的 cap 恰好等于 len
	aliasA := base                                               // 复制的是 {ptr, len, cap}, 两者指向同一底层数组
	fmt.Println("base 与 aliasA 共享底层数组:", &base[0] == &aliasA[0]) // true

	// 坑 4: 下标写入会直接命中共享数组, 这才是真正"改到对方"的操作
	aliasA[0] = 99
	fmt.Println("  写入 aliasA[0] 后 base =", base) // [99 2 3] 被改了

	// 坑 5: append 不扩容时会就地写入共享数组, 但原切片的 len 不变, 所以"看不见"
	big := make([]int, 3, 10)
	copy(big, []int{1, 2, 3})
	bigAlias := big
	bigAlias = append(bigAlias, 9) // cap 够用, 不扩容
	fmt.Printf("  big=%v len=%d  bigAlias=%v  共享=%v\n",
		big, len(big), bigAlias, &big[0] == &bigAlias[0])
	// 只有把 len 拉到 cap, 才能看到 append 写进尾部空闲区的 9
	fmt.Println("  big[:cap(big)] =", big[:cap(big)]) // [1 2 3 9 0 0 0 0 0 0] 9 挤在前 4 个位置
	// 结论: 判断"会不会影响"不能只看是否扩容, 要看有没有其它切片别名共享该数组

	// 扩容则会分配新数组并拷贝, 从此两者互不影响
	src := []int{1, 2, 3}
	dup := src
	dup = append(dup, src...) // len 3 -> 6 超过 cap 3, 必须扩容
	fmt.Printf("  扩容后 src=%v cap=%d  dup=%v cap=%d  共享=%v\n",
		src, cap(src), dup, cap(dup), &src[0] == &dup[0])
	// append 永远不会修改原切片的头: src 的 len/cap 始终是 3/3

	// 坑 6: 想彻底切断关联必须深拷贝, dup := src 不够
	//   clone := slices.Clone(src)   (见 33_slices_advanced/01_slices_package.go)
	//   clone := append([]int(nil), src...)
	//   copy(dst, src) 需要先用 make 准备出足够的 len

	// 坑 7: 原地删除会覆盖共享数组, 别名切片看到的是被改过的数据
	nums := []int{1, 2, 3, 4, 5}
	view := nums[:2]                     // view 与 nums 共享底层数组
	nums = append(nums[:1], nums[2:]...) // 就地删除 nums[1], 等价于 copy(nums[1:], nums[2:])
	fmt.Printf("  nums=%v  view=%v  <- view[1] 被覆盖成 %d\n", nums, view, view[1])
	// 安全做法: nums = slices.Delete(nums, 1, 2) 并避免长期持有 view 这类子切片
}
