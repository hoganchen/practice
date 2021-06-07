/*
 * @lc app=leetcode.cn id=20 lang=golang
 *
 * [20] 有效的括号
 */
/*
方法一：栈

判断括号的有效性可以使用「栈」这一数据结构来解决。

我们遍历给定的字符串 sss。当我们遇到一个左括号时，我们会期望在后续的遍历中，有一个相同类型的右括号将其闭合。由于后遇到的左括号要先闭合，因此我们可以将这个左括号放入栈顶。

当我们遇到一个右括号时，我们需要将一个相同类型的左括号闭合。此时，我们可以取出栈顶的左括号并判断它们是否是相同类型的括号。如果不是相同的类型，或者栈中并没有左括号，那么字符串 sss 无效，返回 False\text{False}False。为了快速判断括号的类型，我们可以使用哈希表存储每一种括号。哈希表的键为右括号，值为相同类型的左括号。

在遍历结束后，如果栈中没有左括号，说明我们将字符串 sss 中的所有左括号闭合，返回 True\text{True}True，否则返回 False\text{False}False。

注意到有效字符串的长度一定为偶数，因此如果字符串的长度为奇数，我们可以直接返回 False\text{False}False，省去后续的遍历判断过程。
*/
// @lc code=start
func isValid(s string) bool {
	// 判断字符是否是2的整数倍，不是则表示有不成对的字符
	n := len(s)
	if 1 == n % 2{
		return false
	}

	pairs := map[byte]byte{'}': '{', ']': '[', ')': '('}
	stack := make([]byte, 0)

	for i := 0; i < n; i++ {
		// 判断当前字符是否为右括号，是则比较，不是则加入到栈中
		if _, ok := pairs[s[i]]; ok {
			if 0 == len(stack) || stack[len(stack)-1] != pairs[s[i]] {
				return false
			}
			stack = stack[:len(stack)-1]
		} else {
			stack = append(stack, s[i])
		}
	}

	return 0 == len(stack)
}
// @lc code=end

