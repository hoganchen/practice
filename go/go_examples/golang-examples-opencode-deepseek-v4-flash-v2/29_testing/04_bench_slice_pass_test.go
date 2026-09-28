// ============================================================================
// 知识点: 切片传参改写的基准测试
//
// 说明:
// - 对比 04_bench_slice_pass_main.go 里两种改写切片头的写法的纳秒级差异
// - b.ReportAllocs() 输出分配字节数和次数, b.ResetTimer() 排除初始化开销
// - 内层照例循环 benchN 次 append, 外层的 benchSink 赋值用于阻止编译器优化

// 实测结论 (append 1 个 int, 内层循环 100 次, 16 核 / go1.25, 多次运行):
//
//   A 传指针 *[]int   允许内联 46 - 57 ns/op   |  禁止内联  92 - 123 ns/op
//   B 返回值 []int    允许内联 35 - 40 ns/op   |  禁止内联 100 - 115 ns/op
//   堆分配: 四组全是 0 B/op, 0 allocs/op -- 传指针不会让切片头逃逸到堆上
//
// 内联时 B 稳定快约 30% (objdump 逐指令核对 + benchstat -count=20 实测
//   -28.70%, p=0.000):
//   - A 版本要对局部变量取址 (&s), 编译器只能让切片头驻留栈内存,
//     内层循环每轮都是 3 次栈读取 + 1 次栈写回
//   - B 版本的切片头全程待在寄存器里, 循环体内一条 SP 访存都没有
//   - 这个开销只在函数小到会被内联时才显著, 而小函数恰恰就会被内联
//
// 禁止内联时两组差异在 10% 以内, 但方向不可复现:
//   - benchstat -count=20 单次运行给出 "A 快 7.72% (p=0.000)", 看着很硬
//   - 但换个时间再跑方向就翻转, 曾测到 "B 快 18%"
//   - 即存在"运行间系统性偏移", 这是运行内置信区间盖不住的
//   - 所以跨运行的结论不可依赖, 不要为这点差异改 API
//
// 结论: 这点差异不值得用来选 API, 按语义选 B (与 append / slices.Delete
//   保持一致), 性能交给编译器

// 运行基准测试:
//   go test ./29_testing/ -run='^$' -bench=Slice -benchmem   # 不加 -v 也能看全
//   go test ./29_testing/ -bench=Slice -gcflags=-m   # 看内联与逃逸分析
//   go test ./29_testing/ -bench=Slice -cpu=1,2,4    # 看多核下的表现
//
// 为什么纯测性能时要加 -run='^$' (它是个只匹配空字符串的正则, 测试名都不为空):
//   - -bench 和 -run 是两个正交的过滤器, 前者只筛 BenchmarkXxx, 后者只筛 TestXxx,
//     而 -run 的默认值是 "." (匹配全部), 所以只写 -bench 根本挡不住 Test
//   - Test 先跑、benchmark 后跑, 于是任何一个 Test 失败都会让 benchmark 压根不启动
//   - 不加它也能跑, 前提是整套测试都通过; 想确认 Test 有没有跑, 加 -v 看 === RUN
//   - 通过 Test 在默认(不加 -v)下完全不打印, 别以为它们没跑; -count 对两者都生效
//
// 用 benchstat 做显著性检验 (别靠肉眼扫几行 ns/op, 上面那组数据就是这么读错的):
//   go install golang.org/x/perf/cmd/benchstat@latest
//   go test ./29_testing/ -run='^$' -bench=Slice -count=10 > old.txt   # 改代码前
//   ... 改代码 ...
//   go test ./29_testing/ -run='^$' -bench=Slice -count=10 > new.txt   # 改代码后
//   benchstat old.txt new.txt
// benchstat 按 benchmark 名配对比较, 所以要对比 A/B 这两种不同名的写法,
// 得先把名字 sed 成同一个:
//   go test ./29_testing/ -run='^$' -bench='^BenchmarkSlicePassPtr$' -count=20 \
//     | sed 's/BenchmarkSlicePassPtr/BenchmarkAB/' > ptr.txt
//   go test ./29_testing/ -run='^$' -bench='^BenchmarkSlicePassReturn$' -count=20 \
//     | sed 's/BenchmarkSlicePassReturn/BenchmarkAB/' > ret.txt
//   benchstat ptr.txt ret.txt
//   (名字必须保留 Benchmark 前缀, 否则 benchstat 静默跳过全部采样, 一个字都不输出)
//
// 另外两点实测教训:
//   - -benchtime 别为了跑得快而调小, 迭代次数不足会把噪声放大数倍
//     (实测 -benchtime=50000x 时, 同一组 benchmark 出现 34.07 与 56.39 ns/op)
//   - benchstat 的 p 值只说明"同一次运行内"的差异, 上面那条禁止内联的结论
//     就是 p=0.000 但换个时间方向翻转的例子
// ============================================================================

package main

import "testing"

const benchN = 100

// 防止编译器把循环里的 append 判定为无用而优化掉
var benchSink []int

// 先验证两个实现行为一致, 避免基准测试测了个错的函数
func TestSlicePassEquivalence(t *testing.T) {
	viaPtr := []int{1, 2, 3}
	appendViaPtr(&viaPtr, 999)

	viaRet := []int{1, 2, 3}
	viaRet = appendReturn(viaRet, 999)

	if len(viaPtr) != len(viaRet) {
		t.Fatalf("长度不一致: ptr=%d ret=%d", len(viaPtr), len(viaRet))
	}
	for i := range viaPtr {
		if viaPtr[i] != viaRet[i] {
			t.Errorf("下标 %d 不一致: ptr=%d ret=%d", i, viaPtr[i], viaRet[i])
		}
	}
}

// 禁止内联: 真实函数调用, A 略快
func BenchmarkSlicePassPtrNoInline(b *testing.B) {
	s := make([]int, 0, benchN)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		s = s[:0]
		for j := 0; j < benchN; j++ {
			appendViaPtrNI(&s, j)
		}
		benchSink = s
	}
}

func BenchmarkSlicePassReturnNoInline(b *testing.B) {
	s := make([]int, 0, benchN)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		s = s[:0]
		for j := 0; j < benchN; j++ {
			s = appendReturnNI(s, j)
		}
		benchSink = s
	}
}

// 允许内联: 贴近真实代码, B 快约 30%
func BenchmarkSlicePassPtr(b *testing.B) {
	s := make([]int, 0, benchN)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		s = s[:0]
		for j := 0; j < benchN; j++ {
			appendViaPtr(&s, j)
		}
		benchSink = s
	}
}

func BenchmarkSlicePassReturn(b *testing.B) {
	s := make([]int, 0, benchN)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		s = s[:0]
		for j := 0; j < benchN; j++ {
			s = appendReturn(s, j)
		}
		benchSink = s
	}
}
