// ============================================================
// 知识点：单元测试（测试文件）
//
// 测试是 Go 语言的一等公民，使用 go test 运行。
// 测试函数：func TestXxx(t *testing.T)
// 基准测试：func BenchmarkXxx(b *testing.B)
// 示例函数：func ExampleXxx()
//
// 运行测试：
//   go test -v ./23_testing/
//   go test -bench=. ./23_testing/
//   go test -cover ./23_testing/
// ============================================================

package testing_example

import (
	"testing"
)

// -------- 基本单元测试 --------
func TestAdd(t *testing.T) {
	// 表格驱动测试（Table-driven tests）
	tests := []struct {
		a, b, want int
	}{
		{1, 2, 3},
		{-1, 1, 0},
		{0, 0, 0},
		{100, 200, 300},
	}

	for _, tt := range tests {
		got := Add(tt.a, tt.b)
		if got != tt.want {
			t.Errorf("Add(%d, %d) = %d; 期望 %d", tt.a, tt.b, got, tt.want)
		}
	}
}

// -------- 使用 Fatalf 的测试 --------
func TestDivide(t *testing.T) {
	q, r := Divide(10, 3)
	if q != 3 || r != 1 {
		t.Fatalf("Divide(10, 3) = (%d, %d); 期望 (3, 1)", q, r)
	}

	// 测试除零情况
	q, r = Divide(10, 0)
	if q != 0 || r != 0 {
		t.Fatalf("Divide(10, 0) = (%d, %d); 期望 (0, 0)", q, r)
	}
}

// -------- 子测试（Subtests）--------
func TestIsEven(t *testing.T) {
	testCases := []struct {
		name string
		n    int
		want bool
	}{
		{"偶数", 4, true},
		{"奇数", 3, false},
		{"零", 0, true},
		{"负数偶数", -2, true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got := IsEven(tc.n)
			if got != tc.want {
				t.Errorf("IsEven(%d) = %v; 期望 %v", tc.n, got, tc.want)
			}
		})
	}
}

// -------- 基准测试 --------
func BenchmarkAdd(b *testing.B) {
	// b.N 由框架自动调整
	for i := 0; i < b.N; i++ {
		Add(100, 200)
	}
}

// -------- 基准测试：阶乘 --------
func BenchmarkFactorial(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Factorial(10)
	}
}
