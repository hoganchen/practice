// ============================================================================
// 知识点: 单元测试和基准测试
//
// 说明:
// - 测试函数命名: TestXxx(t *testing.T)
// - 基准测试函数命名: BenchmarkXxx(b *testing.B)
// - 使用 go test 运行测试
// - t.Errorf 报告测试失败
// - b.N 由测试框架自动调整
//
// 运行测试:
//   go test ./29_testing/ -v
//   go test ./29_testing/ -bench=. -benchmem
//   go test ./29_testing/ -cover
// ============================================================================

package main

import (
	"testing"
)

func TestAdd(t *testing.T) {
	cases := []struct {
		a, b, want int
	}{
		{1, 2, 3},
		{0, 0, 0},
		{-1, 1, 0},
		{100, 200, 300},
	}
	for _, c := range cases {
		got := Add(c.a, c.b)
		if got != c.want {
			t.Errorf("Add(%d, %d) = %d, want %d", c.a, c.b, got, c.want)
		}
	}
}

func TestSubtract(t *testing.T) {
	if got := Subtract(10, 3); got != 7 {
		t.Errorf("Subtract(10, 3) = %d, want 7", got)
	}
}

func TestDivide(t *testing.T) {
	got, err := Divide(10, 3)
	if err != nil {
		t.Errorf("Divide(10, 3) 不应返回错误, got %v", err)
	}
	if got != 3 {
		t.Errorf("Divide(10, 3) = %d, want 3", got)
	}
}

func TestDivideByZero(t *testing.T) {
	_, err := Divide(10, 0)
	if err == nil {
		t.Error("Divide(10, 0) 应返回错误")
	}
}

func TestFactorial(t *testing.T) {
	cases := []struct {
		n    int
		want int
	}{
		{0, 1},
		{1, 1},
		{5, 120},
		{10, 3628800},
	}
	for _, c := range cases {
		got, err := Factorial(c.n)
		if err != nil {
			t.Errorf("Factorial(%d) 不应返回错误, got %v", c.n, err)
		}
		if got != c.want {
			t.Errorf("Factorial(%d) = %d, want %d", c.n, got, c.want)
		}
	}
}

// 基准测试
func BenchmarkAdd(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Add(100, 200)
	}
}

func BenchmarkFactorial(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Factorial(10)
	}
}
