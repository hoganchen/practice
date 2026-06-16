/*
 * ============================================
 * 知识点：if-else 条件判断
 * 说明：
 *   if-else 是最基本的条件控制结构。
 *   根据条件的真假决定程序的执行路径。
 *
 * 语法：
 *   if (条件) {
 *       // 条件为真时执行
 *   } else if (条件2) {
 *       // 条件2为真时执行
 *   } else {
 *       // 所有条件都不满足时执行
 *   }
 *
 * 编译方法：
 *   gcc 01_if_else.c -o 01_if_else
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

int main() {
    // ========== 基础 if 语句 ==========
    printf("===== 基础 if =====\n");
    int score = 85;

    if (score >= 60) {
        printf("分数 %d: 及格\n", score);
    }

    // ========== if-else ==========
    printf("\n===== if-else =====\n");
    int age = 17;

    if (age >= 18) {
        printf("年龄 %d: 成年人\n", age);
    } else {
        printf("年龄 %d: 未成年人\n", age);
    }

    // ========== if-else if-else ==========
    printf("\n===== if-else if-else =====\n");
    score = 75;

    if (score >= 90) {
        printf("优秀\n");
    } else if (score >= 80) {
        printf("良好\n");
    } else if (score >= 70) {
        printf("中等\n");
    } else if (score >= 60) {
        printf("及格\n");
    } else {
        printf("不及格\n");
    }

    // ========== 嵌套 if 语句 ==========
    printf("\n===== 嵌套 if =====\n");
    int year = 2024;

    // 判断闰年
    if (year % 4 == 0) {
        if (year % 100 == 0) {
            if (year % 400 == 0) {
                printf("%d 年是闰年\n", year);
            } else {
                printf("%d 年不是闰年\n", year);
            }
        } else {
            printf("%d 年是闰年\n", year);
        }
    } else {
        printf("%d 年不是闰年\n", year);
    }

    // 更简洁的写法（逻辑运算符）
    if ((year % 400 == 0) || (year % 4 == 0 && year % 100 != 0)) {
        printf("（简洁写法）%d 年是闰年\n", year);
    }

    // ========== if 中的赋值 ==========
    printf("\n===== 条件中的赋值 =====\n");
    int x;

    // 赋值表达式的值就是被赋的值
    if ((x = 5) > 0) {
        printf("x = %d, 大于 0\n", x);
    }

    // ========== 常见错误 ==========
    printf("\n===== 常见错误 =====\n");

    // 错误1：忘记花括号
    /*
     * if (条件)
     *     printf("第一行\n");  // 只有这一行属于if
     *     printf("第二行\n");  // 这一行总是执行
     * 推荐：即使是单行语句也使用花括号
     */
    int condition = 0;
    if (condition)
        printf("这条不会执行\n");
        printf("但这条会执行！因为不在if块内\n");  // 注意缩进有误导性

    if (condition) {
        printf("这条不会执行\n");
        printf("这条也不会执行\n");
    }

    // 错误2：分号位置错误
    // if (condition); {   // 分号结束了if语句
    //     printf("这条总是执行\n");
    // }

    if (condition) {      // 正确写法
        printf("不会执行\n");
    }

    // 错误3：else 不匹配
    int a = 10, b = 20, c = 30;
    if (a > b)
        if (a > c)
            printf("a最大\n");
        // else 会匹配最近的那个 if
        else
            printf("a不是最大\n");
    // 上面的 else 实际匹配的是 if (a > c)
    // 使用花括号可以避免歧义：
    if (a > b) {
        if (a > c) {
            printf("a最大(确定)\n");
        }
    } else {
        printf("a <= b\n");
    }

    // ========== 悬垂 else (dangling else) ==========
    printf("\n===== 悬垂 else =====\n");
    int n1 = 10, n2 = 20, n3 = 30;

    // 下面的 else 与哪个 if 匹配？
    if (n1 > n2)
        if (n1 > n3)
            printf("n1最大\n");
    else
        printf("n1 <= n2\n");  // else 匹配最近的 if(n1 > n3)

    // 用花括号使意图明确
    if (n1 > n2) {
        if (n1 > n3) {
            printf("n1最大\n");
        }
    } else {
        printf("n1 <= n2 (意图明确)\n");
    }

    // ========== 条件表达式的简洁写法 ==========
    printf("\n===== 简洁写法 =====\n");
    int flag = 1;

    // 直接判断非零值
    if (flag) {           // 等价于 if (flag != 0)
        printf("flag 为真\n");
    }

    if (!flag) {          // 等价于 if (flag == 0)
        printf("flag 为假\n");
    }

    // 指针判空
    int *ptr = NULL;
    if (ptr == NULL) {
        printf("指针为空\n");
    }
    // 或
    if (!ptr) {
        printf("指针为空（另一种写法）\n");
    }

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. if 条件为 0 时执行 else 分支
 * 2. 即使单行语句也使用花括号 {}，避免错误
 * 3. 注意悬垂 else 问题（else 匹配最近的 if）
 * 4. 嵌套 if 注意层次清晰
 * 5. 对于复杂的条件组合，使用逻辑运算符
 * ============================================
 */
