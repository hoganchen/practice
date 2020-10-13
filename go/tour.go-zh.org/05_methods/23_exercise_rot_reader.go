package main

import (
	"io"
	"os"
	"fmt"
	"strings"
)

const exec_order = 3

type rot13Reader struct {
	r io.Reader
}

// 如果在函数返回值什么的地方，定义了返回值的名字，则在函数体中，该变量不需要重新短赋值声明，而且在返回处直接return
func (rot rot13Reader) Read(b []byte) (n int, err error) {
	n, err = rot.r.Read(b)
	// fmt.Printf("n: %v, err: %v\n", n, err)

	for i:= 0; i < len(b); i++ {
		switch exec_order {
		case 0:
			switch {
			case b[i] >= 'a' && b[i] < 'n', b[i] >= 'A' && b[i] < 'N':
				b[i] += 13
			case b[i] > 'm' && b[i] <= 'z', b[i] > 'M' && b[i] <= 'Z':
				b[i] -= 13
			default:
				// continue
			}

		case 1:
			switch {
			case b[i] >= 'a' && b[i] < 'n', b[i] >= 'A' && b[i] < 'N':
				b[i] += 13
			case b[i] > 'm' && b[i] <= 'z', b[i] > 'M' && b[i] <= 'Z':
				b[i] -= 13
			}

		case 2:
			if (b[i] >= 'a' && b[i] < 'n') || (b[i] >= 'A' && b[i] < 'N') {
				b[i] += 13
			} else if (b[i] > 'm' && b[i] <= 'z') || (b[i] > 'M' && b[i] <= 'Z') {
				b[i] -= 13
			}

		case 3:
			switch {
			case b[i] >= 'a' && b[i] < 'n':
				fallthrough
			case b[i] >= 'A' && b[i] < 'N':
				b[i] += 13
			case b[i] > 'm' && b[i] <= 'z':
				fallthrough
			case b[i] > 'M' && b[i] <= 'Z':
				b[i] -= 13
			}
		}
	}

	return
}

/*

练习：rot13Reader

有种常见的模式是一个 io.Reader 包装另一个 io.Reader，然后通过某种方式修改其数据流。

例如，gzip.NewReader 函数接受一个 io.Reader（已压缩的数据流）并返回一个同样实现了 io.Reader 的 *gzip.Reader（解压后的数据流）。

编写一个实现了 io.Reader 并从另一个 io.Reader 中读取数据的 rot13Reader，通过应用 rot13 代换密码对数据流进行修改。

rot13Reader 类型已经提供。实现 Read 方法以满足 io.Reader。

*/
func main() {
	s := strings.NewReader("Lbh penpxrq gur pbqr!")
	r := rot13Reader{s}
	io.Copy(os.Stdout, &r)
	fmt.Println()
}
