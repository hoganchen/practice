/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"regexp"
)

func match_string_func(match_str string) {
	fmt.Printf("\n\n############################## MatchString Function ##############################\n")

	// .会匹配任意字符，所以如下正则表达式也会匹配"http://www.xiladaili#com/putong/"字符串
	mch_obj, err := regexp.MatchString("xiladaili.com", match_str)
	fmt.Printf("mch_obj: %v, err: %v\n", mch_obj, err)

	// MatchString函数的参数为string
	mch_bool, err := regexp.MatchString(`xiladaili.com`, match_str)
	fmt.Printf("mch_bool: %v, err: %v\n", mch_bool, err)

	match_obj, err := regexp.MatchString("xiladaili\\.com", match_str)
	fmt.Printf("match_obj: %v, err: %v\n", match_obj, err)

	// MatchString函数的参数为string
	matched_bool, err := regexp.MatchString(`xiladaili\.com`, match_str)
	fmt.Printf("matched_bool: %v, err: %v\n", matched_bool, err)

	/*
	func Match(pattern string, b []byte) (matched bool, err error)

	Match检查b中是否存在匹配pattern的子序列。更复杂的用法请使用Compile函数和Regexp对象。
	*/
	// Match函数的参数为byte类型的切片
	matched, err := regexp.Match("xiladaili\\.com", []byte(match_str))
	fmt.Printf("matched: %v, err: %v\n", matched, err)

	if matched, _ := regexp.MatchString("xiladaili\\.com", match_str); matched {
		fmt.Printf("xiladaili.com matched\n")
	} else if matched, _ := regexp.MatchString("kuaidaili\\.com", match_str); matched {
		fmt.Printf("kuaidaili.com matched\n")
	} else {
		fmt.Printf("not matched\n")
	}
}

func compile_func(match_str string) {
	fmt.Printf("\n\n############################## Compile Function ##############################\n")

	/*
	Compile解析并返回一个正则表达式。如果成功返回，该Regexp就可用于匹配文本。
	在匹配文本时，该正则表达式会尽可能早的开始匹配，并且在匹配过程中选择回溯搜索到的第一个匹配结果。
	这种模式被称为“leftmost-first”，Perl、Python和其他实现都采用了这种模式，但本包的实现没有回溯的损耗。
	对POSIX的“leftmost-longest”模式，参见CompilePOSIX。
	*/
	var re *regexp.Regexp
	re, _ = regexp.Compile("^http[s]*//www\\.xiladaili\\.com")
	fmt.Printf("type(re): %T\n", re)

	reg, _ := regexp.Compile("^http[s]*//www\\.xiladaili\\.com")
	fmt.Printf("type(reg): %T\n", reg)

	// MustCompile类似Compile但会在解析失败时panic，主要用于全局正则表达式变量的安全初始化。
	regex := regexp.MustCompile("^http[s]*//www\\.xiladaili\\.com")
	fmt.Printf("type(regex): %T\n", regex)
}

func find_func(match_str string) {
	fmt.Printf("\n\n############################## Find Function ##############################\n")

	reg, _ := regexp.Compile("^http[s]*://www\\.xiladaili\\.com")
	must_reg := regexp.MustCompile("^http[s]*://www\\.xiladaili\\.com")

	not_reg, _ := regexp.Compile("^http[s]*//www\\.xiladaili\\.com")
	must_not_reg := regexp.MustCompile("^http[s]*//www\\.xiladaili\\.com")

	match_bytes := reg.Find([]byte(match_str))
	fmt.Printf("Find: match_bytes: %v\n", match_bytes)

	must_match_bytes := must_reg.Find([]byte(match_str))
	fmt.Printf("Find: must_match_bytes: %v\n", must_match_bytes)

	match_not_bytes := not_reg.Find([]byte(match_str))
	fmt.Printf("Find: match_not_bytes: %v\n", match_not_bytes)

	must_not_match_bytes := must_not_reg.Find([]byte(match_str))
	fmt.Printf("Find: must_not_match_bytes: %v\n", must_not_match_bytes)

	var matched_str, must_matched_str string

	matched_str = reg.FindString(match_str)
	fmt.Printf("FindString: matched_str: %v\n", matched_str)

	must_matched_str = must_reg.FindString(match_str)
	fmt.Printf("FindString: must_matched_str: %v\n", must_matched_str)

	sub_matched_bytes := reg.FindSubmatch([]byte(match_str))
	fmt.Printf("FindSubmatch: sub_matched_bytes: %v\n", sub_matched_bytes)

	/*
	Find返回一个保管正则表达式re在b中的最左侧的一个匹配结果以及（可能有的）分组匹配的结果的[]string切片。如果没有匹配到，会返回nil。
	*/
	sub_matched_str := reg.FindStringSubmatch(match_str)
	fmt.Printf("FindStringSubmatch: sub_matched_str: %v\n", sub_matched_str)

	must_sub_matched_index := must_reg.FindStringSubmatchIndex(match_str)
	fmt.Printf("FindStringSubmatchIndex: must_sub_matched_index: %v\n", must_sub_matched_index)

	var match_index []int
	/*
	Find返回保管正则表达式re在b中的最左侧的一个匹配结果的起止位置的切片（显然len(loc)==2）。
	匹配结果可以通过起止位置对b做切片操作得到：b[loc[0]:loc[1]]。如果没有匹配到，会返回nil。
	*/
	match_index = reg.FindIndex([]byte(match_str))
	fmt.Printf("FindIndex: match_index: %v, match_value: %v\n", match_index, match_str[match_index[0]:match_index[1]])

	/*
	Find返回保管正则表达式re在b中的最左侧的一个匹配结果的起止位置的切片（显然len(loc)==2）。
	匹配结果可以通过起止位置对b做切片操作得到：b[loc[0]:loc[1]]。如果没有匹配到，会返回nil。
	*/
	match_index = reg.FindStringIndex(match_str)
	// fmt.Printf("match_index: %v\n", match_index)
	fmt.Printf("FindStringIndex: match_index: %v, match_value: %v\n", match_index, match_str[match_index[0]:match_index[1]])

	match_index = reg.FindSubmatchIndex([]byte(match_str))
	// fmt.Printf("match_index: %v\n", match_index)
	fmt.Printf("FindSubmatchIndex: match_index: %v, match_value: %v\n", match_index, match_str[match_index[0]:match_index[1]])

	match_index = reg.FindStringSubmatchIndex(match_str)
	// fmt.Printf("match_index: %v\n", match_index)
	fmt.Printf("FindStringSubmatchIndex: match_index: %v, match_value: %v\n", match_index, match_str[match_index[0]:match_index[1]])
}

func find_all_func(match_str string) {
	fmt.Printf("\n\n############################## FindAll Function ##############################\n")

	reg, _ := regexp.Compile(`(\w+)\.com`)
	must_reg := regexp.MustCompile(`(\w+)\.com`)

	match_bytes := reg.FindAll([]byte(match_str), -1)
	fmt.Printf("match_bytes: %v\n", match_bytes)

	must_match_bytes := must_reg.FindAll([]byte(match_str), -1)
	fmt.Printf("must_match_bytes: %v\n", must_match_bytes)

	matched_str := reg.FindAllString(match_str, -1)
	fmt.Printf("matched_str: %v\n", matched_str)

	must_matched_str := must_reg.FindAllString(match_str, -1)
	fmt.Printf("must_matched_str: %v\n", must_matched_str)

	/*
	Find返回一个保管正则表达式re在b中的所有不重叠的匹配结果及其对应的（可能有的）分组匹配的结果的[][]string切片。
	如果没有匹配到，会返回nil。
	*/
	must_all_matched_str := must_reg.FindAllStringSubmatch(match_str, -1)
	fmt.Printf("must_all_matched_str: %v\n", must_all_matched_str)

}

func split_func(match_str string) {
	fmt.Printf("\n\n############################## Split Function ##############################\n")

	must_reg := regexp.MustCompile(`;`)

	/*
	Split将re在s中匹配到的结果作为分隔符将s分割成多个字符串，并返回这些正则匹配结果之间的字符串的切片。
	返回的切片不会包含正则匹配的结果，只包含匹配结果之间的片段。当正则表达式re中不含正则元字符时，本方法等价于strings.SplitN。
	*/
	split_str := must_reg.Split(match_str, -1)
	fmt.Printf("split_str: %v\n", split_str)
}

/*
https://stackoverflow.com/questions/6770898/unknown-escape-sequence-error-in-go/6770913
unknown escape sequence错误，在golang中如果字符串内有太多特殊字符，又不想写转义的话，就用反引号替换双引号，把特殊字符次包裹起来。

总共有 16 种函数按照以下命名模式：
Find(All)?(String)?(Submatch)?(Index)?
	如果存在 All ，则函数匹配连续的非重叠匹配。
	String 表示参数是一个字符串，否则为字节切片。
	如果存在 Submatch ，则返回值是连续字匹配的切片。字匹配是正则表达式中带括号的子表达式的匹配。示例详见 FindSubmatch 。
	如果存在 Index ，则通过字节索引对来识别匹配项和子匹配项。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	match_str := "http://www.xiladaili.com/putong/"

	match_string_func(match_str)
	match_string_func("http://www.xiladaili#com/putong/")
	compile_func(match_str)
	find_func(match_str)

	match_all_str := "http://www.xiladaili.com/putong/; https://www.kuaidaili.com/free/inha/; https://www.xicidaili.com/nn/"
	find_all_func(match_all_str)
	split_func(match_all_str)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
