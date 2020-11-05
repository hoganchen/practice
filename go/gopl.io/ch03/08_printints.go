package main

import (
	"bytes"
	"fmt"
)

/*
当向bytes.Buffer添加任意字符的UTF8编码时,最好使用bytes.Buffer的WriteRune方法,但是WriteByte方法对于写入类似'['和']'等ASCII字符则会更加有效
*/
// intsToString is like fmt.Sprintf(values) but adds commas.
func intsToString(values []int) string {
	var buf bytes.Buffer
	buf.WriteByte('[')
	for i, v := range values {
		if i > 0 {
			buf.WriteString(", ")
		}
		fmt.Fprintf(&buf, "%d", v)
	}
	buf.WriteByte(']')
	return buf.String()
}

func main() {
	fmt.Println(intsToString([]int{1, 2, 3})) // "[1, 2, 3]"
}
