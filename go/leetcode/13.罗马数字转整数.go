/*
 * @lc app=leetcode.cn id=13 lang=golang
 *
 * [13] 罗马数字转整数
 */

/*
方法一：模拟

思路

通常情况下，罗马数字中小的数字在大的数字的右边。若输入的字符串满足该情况，那么可以将每个字符视作一个单独的值，累加每个字符对应的数值即可。

例如 XXVII\texttt{XXVII}XXVII 可视作 X+X+V+I+I=10+10+5+1+1=27\texttt{X}+\texttt{X}+\texttt{V}+\texttt{I}+\texttt{I}=10+10+5+1+1=27X+X+V+I+I=10+10+5+1+1=27。

若存在小的数字在大的数字的左边的情况，根据规则需要减去小的数字。对于这种情况，我们也可以将每个字符视作一个单独的值，若一个数字右侧的数字比它大，则将该数字的符号取反。

例如 XIV\texttt{XIV}XIV 可视作 X−I+V=10−1+5=14\texttt{X}-\texttt{I}+\texttt{V}=10-1+5=14X−I+V=10−1+5=14。
*/
 // @lc code=start
func romanToInt(s string) int {
	symbolValues := map[byte]int{'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}

	ans := 0
    n := len(s)

    for i := range s {
        value := symbolValues[s[i]]
		// 检查是否是最后一个字符，并判断左边的字符是否比右边的大
        if i < n-1 && value < symbolValues[s[i+1]] {
            ans -= value
        } else {
            ans += value
        }
    }

    return ans
}
// @lc code=end

