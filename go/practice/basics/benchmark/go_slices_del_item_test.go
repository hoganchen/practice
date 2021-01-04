package benchmark

import (
    "testing"
)

// http://c.biancheng.net/view/124.html
// http://c.biancheng.net/view/5409.html
// https://maiyang.me/post/2018-11-14-go-test/
// https://www.cnblogs.com/sunsky303/p/11818480.html

// go test 命令，会自动读取源码目录下面名为 *_test.go 的文件
// go test -v -bench=. -benchtime=3s -benchmem

var (
    // 原始slice
    origin = []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
    // 需要删除的元素
    targetEle = 6
)

// 第一种
func BenchmarkMake(t *testing.B) {
    t.ResetTimer()

    for i := 0; i < t.N; i++ {
        target := make([]int, 0, len(origin))
        for _, item := range origin {
            if item != targetEle {
                target = append(target, item)
            }
        }
    }
}

// 第二种
func BenchmarkReuse(t *testing.B) {
    t.ResetTimer()

    for i := 0; i < t.N; i++ {
        target := origin[:0]
        for _, item := range origin {
            if item != targetEle {
                target = append(target, item)
            }
        }
    }
}

// 第三种
func BenchmarkEditOne(t *testing.B) {
    t.ResetTimer()

    for i := 0; i < t.N; i++ {
        for i := 0; i < len(origin); i++ {
            if origin[i] == targetEle {
                origin = append(origin[:i], origin[i+1:]...)
                i-- // maintain the correct index
            }
        }
    }
}