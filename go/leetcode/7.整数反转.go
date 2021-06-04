/*
 * @lc app=leetcode.cn id=7 lang=golang
 *
 * [7] 整数反转
 */
import "math"
/*
方法一：数学

思路

记 rev\textit{rev}rev 为翻转后的数字，为完成翻转，我们可以重复「弹出」xxx 的末尾数字，将其「推入」rev\textit{rev}rev 的末尾，直至 xxx 为 000。

要在没有辅助栈或数组的帮助下「弹出」和「推入」数字，我们可以使用如下数学方法：

// 弹出 x 的末尾数字 digit
digit = x % 10
x /= 10

// 将数字 digit 推入 rev 末尾
rev = rev * 10 + digit

题目需要判断反转后的数字是否超过 323232 位有符号整数的范围 [−231,231−1][-2^{31},2^{31}-1][−231,231−1]，例如 x=2123456789x=2123456789x=2123456789 反转后的 rev=9876543212>231−1=2147483647\textit{rev}=9876543212>2^{31}-1=2147483647rev=9876543212>231−1=2147483647，超过了 323232 位有符号整数的范围。

因此我们需要在「推入」数字之前，判断是否满足

−231≤rev⋅10+digit≤231−1-2^{31}\le\textit{rev}\cdot10+\textit{digit}\le2^{31}-1 −231≤rev⋅10+digit≤231−1

若该不等式不成立则返回 000。
*/
// @lc code=start
// func reverse(x int) int {
// 	rev := 0
//     for x != 0 {
//         if rev < math.MinInt32/10 || rev > math.MaxInt32/10 {
//             return 0
//         }
//         digit := x % 10
//         x /= 10
//         rev = rev*10 + digit
//     }
//     return rev
// }
func reverse(x int) int {
	rev := 0
    for x != 0 {
        digit := x % 10
        x /= 10
        rev = rev * 10 + digit

		if rev < math.MinInt32 || rev > math.MaxInt32 {
            return 0
        }
    }
    return rev
}
// @lc code=end

