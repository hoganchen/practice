/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"io"
	"fmt"
	"time"
	"strings"
)

/*
https://studygolang.com/pkgdoc

作为一种基本数据结构,每种语言都有一些对于字符串的预定义处理函数。Go中使用strings包来完成对字符串的主要操作。

HasPrefix判断字符串s是否以prefix开头:
strings.HasPrefix(s, prefix string) bool

HasSuffix判断字符串s是否以suffix结尾:
strings.HasSuffix(s, suffix string) bool

Index返回字符串str在字符串s中的索引(str的第一个字符的索引),-1表示字符串s不包含字符串str:
strings.Index(s, str string) int

LastIndex返回字符串str在字符串s中最后出现位置的索引(str的第一个字符的索引),-1表示字符串s不包含字符串str:
strings.LastIndex(s, str string) int
如果ch是非ASCII编码的字符,建议使用以下函数来对字符进行定位:
strings.IndexRune(s string, r rune) int

Replace用于将字符串str中的前n个字符串old替换为字符串new,并返回一个新的字符串,如果n =-1则替换所有字符串old为字符串new:
strings.Replace(str, old, new, n) string

Count用于计算字符串str在字符串s中出现的非重叠次数:
strings.Count(s, str string) int

Repeat用于重复count次字符串s并返回一个新的字符串:
strings.Repeat(s, count int) string

ToLower将字符串中的Unicode字符全部转换为相应的小写字符:
strings.ToLower(s) string

ToUpper将字符串中的Unicode字符全部转换为相应的大写字符:
strings.ToUpper(s) string

你可以使用strings.TrimSpace(s)来剔除字符串开头和结尾的空白符号;
如果你想要剔除指定字符,则可以使用strings.Trim(s, "cut")来将开头和结尾的cut去除掉。该函数的第二个参数可以包含任何字符,
如果你只想剔除开头或者结尾的字符串,则可以使用TrimLeft或者TrimRight来实现。

strings.Fields(s)将会利用1个或多个空白符号来作为动态长度的分隔符将字符串分割成若干小块,并返回一个slice,
如果字符串只包含空白符号,则返回一个长度为0的slice。

strings.Split(s, sep)用于自定义分割符号来对指定字符串进行分割,同样返回slice。

Join用于将元素类型为string的slice使用分割符号来拼接组成一个字符串:
strings.Join(sl []string, sep string) string

函数strings.NewReader(str)用于生成一个Reader并读取字符串中的内容,然后返回指向该Reader的指针,从其它类型读取内容的函数还有:
Read()从[]byte中读取内容。
ReadByte()和ReadRune()从字符串中读取下一个byte或者rune。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var str string = "This is an example of a string"
	fmt.Printf("Original String: %v\n", str)

	fmt.Printf("strings.HasPrefix(str, \"Thi\"): %v\n", strings.HasPrefix(str, "Thi"))
	fmt.Printf("strings.HasSuffix(str, \"ing\"): %v\n", strings.HasSuffix(str, "ing"))

	fmt.Printf("strings.Contains(str, \"examp\"): %v\n", strings.Contains(str, "examp"))

	fmt.Printf("strings.Index(str, \"examp\"): %v\n", strings.Index(str, "examp"))
	fmt.Printf("strings.Index(str, \"This\"): %v\n", strings.Index(str, "This"))
	fmt.Printf("strings.Index(str, \"Nothing\"): %v\n", strings.Index(str, "Nothing"))
	fmt.Printf("strings.Index(str, \"is\"): %v\n", strings.Index(str, "is"))
	fmt.Printf("strings.LastIndex(str, \"is\"): %v\n", strings.LastIndex(str, "is"))
	// \u0054, 84, rune('T')都对应T字符的rune类型
	// 其实rune也是Go当中的一个类型,并且是int32的别名。
	fmt.Printf("strings.IndexRune(str, '\u0054'): %v\n", strings.IndexRune(str, '\u0054'))
	fmt.Printf("strings.IndexRune(str, 84): %v\n", strings.IndexRune(str, 84))
	fmt.Printf("strings.IndexRune(str, 'T'): %v\n", strings.IndexRune(str, 'T'))
	fmt.Printf("strings.IndexRune(str, rune('T')): %v\n", strings.IndexRune(str, rune('T')))

	fmt.Printf("strings.Replace(str, \"is\", \"was\" -1): %v\n", strings.Replace(str, "is", "was", -1))
	fmt.Printf("strings.Count(str, \"is\"): %v\n", strings.Count(str, "is"))
	fmt.Printf("strings.Repeat(str, 2): %v\n", strings.Repeat(str, 2))

	fmt.Printf("strings.ToLower(str): %v\n", strings.ToLower(str))
	fmt.Printf("strings.ToUpper(str): %v\n", strings.ToUpper(str))

	// 则可以使用strings.Trim(s, "cut")来将开头和结尾的cut去除掉。
	fmt.Printf("strings.TrimSpace(str): %v\n", strings.TrimSpace("    left 4 space, right 1 tab	"))
	fmt.Printf("strings.Trim(str, \"This\"): %v\n", strings.Trim(str, "This"))
	fmt.Printf("strings.Trim(str, \"is\"): %v\n", strings.Trim(str, "is"))
	fmt.Printf("strings.TrimLeft(str, \"Th\"): %v\n", strings.Trim(str, "Th"))
	fmt.Printf("strings.TrimRight(str, \"ring\"): %v\n", strings.Trim(str, "ring"))

	/*
	strings.Fields(s)将会利用1个或多个空白符号来作为动态长度的分隔符将字符串分割成若干小块,并返回一个slice,
	如果字符串只包含空白符号,则返回一个长度为0的slice。

	strings.Split(s, sep)用于自定义分割符号来对指定字符串进行分割,同样返回slice。
	*/
	sl := strings.Fields("    left 4 space, right 1 tab	")
	fmt.Printf("strings.Fields(str): %v, len(sl): %v\n", sl, len(sl))
	sl = strings.Split("hello, world, welcome to my world", ",")
	fmt.Printf("strings.Split(str): %v, len(sl): %v\n", sl, len(sl))
	fmt.Printf("strings.Join(sl, \"--\"): %v, len(sl): %v\n", strings.Join(sl, "--"), len(sl))

	reader := strings.NewReader(str)
	b := make([]byte, 1)
	fmt.Printf("reader type: %[1]T, reader value: %[1]v\n", *reader)
	fmt.Printf("reader.Len: %v\n", reader.Len())
	by, err := reader.ReadByte()
	fmt.Printf("reader.ReadByte: %c, err: %v\n", by, err)

	for {
		n, err := reader.Read(b)
		fmt.Printf("n = %v err = %v b = %v\n", n, err, b)
		fmt.Printf("b[:n] = %q\n", b[:n])
		if err == io.EOF {
			break
		}
	}

	by, err = reader.ReadByte()
	fmt.Printf("reader.ReadByte: %v, err: %v\n", by, err)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
