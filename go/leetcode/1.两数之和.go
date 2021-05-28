/*
 * @lc app=leetcode.cn id=1 lang=golang
 *
 * [1] 两数之和
 */

// @lc code=start
/*
方法一：暴力枚举

思路及算法

最容易想到的方法是枚举数组中的每一个数 x，寻找数组中是否存在 target - x。

当我们使用遍历整个数组的方式寻找 target - x 时，需要注意到每一个位于 x 之前的元素都已经和 x 匹配过，因此不需要再进行匹配。而每一个元素不能被使用两次，所以我们只需要在 x 后面的元素中寻找 target - x。

复杂度分析

    时间复杂度：O(N2)O(N^2)O(N2)，其中 NNN 是数组中的元素数量。最坏情况下数组中任意两个数都要被匹配一次。

    空间复杂度：O(1)O(1)O(1)。
*/
/*
func twoSum(nums []int, target int) []int {
	for i := 0; i < len(nums) - 1; i++ {
		for j := i + 1; j < len(nums); j++ {
			if target == nums[i] + nums[j] {
				return []int{i, j}
			}
		}
	}
	return nil
}

// 该解法存在问题，会都去迭代最后一个元素
// func twoSum(nums []int, target int) []int {
// 	for i, v := range nums {
// 		for j := i + 1; j < len(nums); j++ {
// 			if target == v + nums[j] {
// 				return []int{i, j}
// 			}
// 		}
// 	}
// 	return nil
// }
*/

/*
方法二：哈希表

思路及算法

注意到方法一的时间复杂度较高的原因是寻找 target - x 的时间复杂度过高。因此，我们需要一种更优秀的方法，能够快速寻找数组中是否存在目标元素。如果存在，我们需要找出它的索引。

使用哈希表，可以将寻找 target - x 的时间复杂度降低到从 O(N)O(N)O(N) 降低到 O(1)O(1)O(1)。

这样我们创建一个哈希表，对于每一个 x，我们首先查询哈希表中是否存在 target - x，然后将 x 插入到哈希表中，即可保证不会让 x 和自己匹配。

复杂度分析

    时间复杂度：O(N)O(N)O(N)，其中 NNN 是数组中的元素数量。对于每一个元素 x，我们可以 O(1)O(1)O(1) 地寻找 target - x。

    空间复杂度：O(N)O(N)O(N)，其中 NNN 是数组中的元素数量。主要为哈希表的开销。
*/
// /*
func twoSum(nums []int, target int) []int {
	hashTable := map[int]int{}
	// 第一个值为当前元素的下标，第二个值为该下标所对应元素的一份副本。
    for i, x := range nums {
		// 查看target - x的值是否在hash表中，因为是在整个hash表中查找，所以不用先把nums的值先hash存储
		// 即当前查找第一个元素，但第一个元素已经与第N个元素能够配对，但是hash表中没有第N个元素的值，
		// 但是当查找第N个元素的时候，第一个元素的hash值一定在hash表中，所以这时就能配对
        if p, ok := hashTable[target - x]; ok {
            return []int{p, i}
        }
		// x 插入到哈希表中，即可保证不会让 x 和自己匹配。
        hashTable[x] = i
    }
    return nil
}
// */
// @lc code=end
