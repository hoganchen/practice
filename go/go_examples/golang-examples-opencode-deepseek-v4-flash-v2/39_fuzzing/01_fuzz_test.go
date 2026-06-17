// ============================================================================
// 知识点: Fuzz 测试 (Fuzzing, Go 1.18+)
//
// 说明:
// - FuzzXxx(f *testing.F) 格式, f.Fuzz 接收目标函数
// - f.Add 添加种子语料 (初始测试用例)
// - f.Fuzz 中传入的函数参数类型必须匹配种子类型
// - 运行: go test -fuzz=Fuzz -fuzztime=30s
// - 发现崩溃后, 数据写入 testdata/fuzz/ 目录
//
// 运行:
//   go test ./39_fuzzing/ -fuzz=FuzzReverse -fuzztime=5s
// ============================================================================

package main

import (
	"testing"
	"unicode/utf8"
)

func FuzzReverse(f *testing.F) {
	// 种子语料库
	seeds := []string{
		"Hello, World!",
		"Go语言",
		"",
		"12345",
		"!@#$%",
	}
	for _, seed := range seeds {
		f.Add(seed)
	}

	f.Fuzz(func(t *testing.T, orig string) {
		// Reverse 两次应恢复原状
		rev, err1 := Reverse(orig)
		if err1 != nil {
			return // 输入无效, 跳过
		}

		doubleRev, err2 := Reverse(rev)
		if err2 != nil {
			t.Fatalf("第二次 Reverse 失败: orig=%q, rev=%q, err=%v", orig, rev, err2)
		}

		if orig != doubleRev {
			t.Fatalf("两次 Reverse 后不一致: orig=%q, doubleRev=%q", orig, doubleRev)
		}

		if utf8.ValidString(orig) && !utf8.ValidString(rev) {
			t.Fatalf("Reverse 产生了无效 UTF-8: orig=%q, rev=%q", orig, rev)
		}
	})
}
