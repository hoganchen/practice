// ============================================================
// 知识点：测试文件（_test.go）
//
// 测试函数以 TestXxx(t *testing.T) 开头。
// t.Error / t.Errorf 报告失败但不停止测试。
// t.Fatal / t.Fatalf 报告失败并立即停止当前测试。
// go test -v 显示详细信息
// go test -run TestAdd 只运行指定测试
// go test -bench . 运行基准测试
// ============================================================

package main

import (
	"fmt"
	"testing"
)

// ---- 1. 基本测试 ----
func TestAdd(t *testing.T) {
	got := Add(2, 3)
	want := 5
	if got != want {
		t.Errorf("Add(2, 3) = %d; want %d", got, want)
	}
}

func TestSubtract(t *testing.T) {
	got := Subtract(10, 3)
	want := 7
	if got != want {
		t.Errorf("Subtract(10, 3) = %d; want %d", got, want)
	}
}

// ---- 2. 表驱动测试（Table-Driven Test） ----
// Go 社区推荐的标准测试模式
func TestDivide(t *testing.T) {
	tests := []struct {
		name     string
		a, b     int
		wantQ    int // 期望商
		wantR    int // 期望余数
	}{
		{"正常除法", 10, 3, 3, 1},
		{"能被整除", 12, 4, 3, 0},
		{"被除数小于除数", 3, 10, 0, 3},
		{"除数为零", 5, 0, 0, 0},
		{"负数", -10, 3, -3, -1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) { // 子测试
			gotQ, gotR := Divide(tt.a, tt.b)
			if gotQ != tt.wantQ || gotR != tt.wantR {
				t.Errorf("Divide(%d, %d) = (%d, %d); want (%d, %d)",
					tt.a, tt.b, gotQ, gotR, tt.wantQ, tt.wantR)
			}
		})
	}
}

// ---- 3. 测试多种情况 ----
func TestFactorial(t *testing.T) {
	tests := []struct {
		n       int
		want    int
		wantErr bool
	}{
		{0, 1, false},
		{1, 1, false},
		{5, 120, false},
		{10, 3628800, false},
		{-1, 0, true}, // 负数有错误
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("n=%d", tt.n), func(t *testing.T) {
			got, err := Factorial(tt.n)
			if (err != nil) != tt.wantErr {
				t.Errorf("Factorial(%d) error = %v; wantErr = %v",
					tt.n, err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("Factorial(%d) = %d; want %d",
					tt.n, got, tt.want)
			}
		})
	}
}

// ---- 4. 使用 t.Fatal ----
func TestIsPrime(t *testing.T) {
	tests := []struct {
		n    int
		want bool
	}{
		{2, true},
		{3, true},
		{4, false},
		{17, true},
		{20, false},
		{97, true},
		{1, false},
		{0, false},
		{-5, false},
	}

	for _, tt := range tests {
		got := IsPrime(tt.n)
		if got != tt.want {
			t.Fatalf("IsPrime(%d) = %t; want %t (已终止)", // Fatal 终止当前测试
				tt.n, got, tt.want)
		}
	}
}

// ---- 5. 跳过测试 ----
func TestSkipExample(t *testing.T) {
	// 在特定条件下跳过测试
	// if runtime.GOOS == "windows" {
	//     t.Skip("跳过 Windows 平台测试")
	// }
	t.Skip("示例：跳过此测试")
}

// ---- 6. 子测试并行化 ----
func TestParallelSubtests(t *testing.T) {
	tests := []struct {
		name string
		n    int
		want bool
	}{
		{"prime_7", 7, true},
		{"prime_13", 13, true},
		{"nonprime_15", 15, false},
	}

	for _, tt := range tests {
		tt := tt // 捕获循环变量（Go 1.22 之前需要）
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel() // 并行执行子测试
			if got := IsPrime(tt.n); got != tt.want {
				t.Errorf("IsPrime(%d) = %t; want %t",
					tt.n, got, tt.want)
			}
		})
	}
}

// ---- 7. 基准测试（Benchmark） ----
// go test -bench .
// go test -bench=Factorial -benchmem

func BenchmarkAdd(b *testing.B) {
	// b.N 由框架自动确定
	for i := 0; i < b.N; i++ {
		Add(1, 2)
	}
}

func BenchmarkFactorial(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Factorial(20)
	}
}

// ---- 8. 示例测试（Example） ----
// 示例函数名以 Example 开头
// 输出通过 // Output: 注释匹配

func ExampleAdd() {
	sum := Add(3, 4)
	fmt.Println(sum)
	// Output: 7
}

func ExampleIsPrime() {
	fmt.Println(IsPrime(7))
	fmt.Println(IsPrime(8))
	// Output:
	// true
	// false
}

// ---- 运行方法 ----
// cd 12_testing
// go test -v                    // 运行所有测试
// go test -v -run TestAdd       // 只运行 TestAdd
// go test -bench .              // 运行基准测试
// go test -bench Factorial -benchmem  // 基准测试 + 内存分配
// go test -cover                // 代码覆盖率
// go test -coverprofile=coverage.out  // 输出覆盖率文件
// go tool cover -html=coverage.out    // 可视化覆盖率
