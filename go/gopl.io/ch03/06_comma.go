package main

import "fmt"

/*
输入comma函数的参数是一个字符串。如果输入字符串的长度小于或等于3的话,则不需要插入逗分隔符。
否则,comma函数将在最后三个字符前位置将字符串切割为两个两个子串并插入逗号分隔符,然后通过递归调用自身来出前面的子串
*/
// comma inserts commas in a non-negative decimal integer string.
func comma(s string) string {
	n := len(s)
	if n <= 3 {
		return s
	}
	return comma(s[:n-3]) + "," + s[n-3:]
}

func main() {
	input := []int{
		233,
		3234,
		876324,
		959743928,
		37237489239,
	}
	for i := range input {
		s := fmt.Sprintf("%d", input[i])
		fmt.Printf("%12d => %14s\n", input[i], comma(s))
	}
}
