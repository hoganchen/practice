/**
 * ============================================================
 * 知识点: 布尔类型 (Boolean Type)
 *
 * C语言在C99标准中引入了 _Bool 作为内置布尔类型。
 * 通过包含 <stdbool.h> 头文件,可以使用更方便的:
 *   bool   - _Bool 的别名
 *   true   - 定义为 1
 *   false  - 定义为 0
 *
 * 核心要点:
 * 1. _Bool 是C99内置类型,<stdbool.h> 提供了 bool/true/false 宏
 * 2. _Bool 变量只能存储 0 或 1(任何非零值赋值给 _Bool 都会变为 1)
 * 3. 任何标量类型(整数、浮点、指针)都可以转换为 bool
 * 4. 条件表达式中,任何非零值都被视为 true
 * 5. bool 类型的大小通常是 1 字节(但由实现定义)
 *
 * 编译指令:
 *   gcc 06_boolean_type.c -o 06_boolean_type.exe -std=c11 -Wall
 * 运行:
 *   ./06_boolean_type.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdbool.h>  /* 提供 bool, true, false 宏 */

/* 函数声明: 返回 bool 类型的函数 */
bool is_even(int num);
bool is_positive(int num);

int main(void)
{
    printf("========================================\n");
    printf("    布尔类型 (Boolean Type) 演示\n");
    printf("========================================\n\n");

    /* ======== 1. bool 变量的基本使用 ======== */
    printf("======== 1. bool 变量的声明与赋值 ========\n");

    bool flag1 = true;   /* true 宏展开为 1  */
    bool flag2 = false;  /* false 宏展开为 0 */
    bool flag3 = 1;      /* 整数 1 赋值给 bool */
    bool flag4 = 0;      /* 整数 0 赋值给 bool */
    bool flag5 = 42;     /* 非零值: 赋值后变为 true(1) */
    bool flag6 = -1;     /* 非零值: 赋值后变为 true(1) */

    printf("flag1 = true  : %d\n", flag1);
    printf("flag2 = false : %d\n", flag2);
    printf("flag3 = 1     : %d\n", flag3);
    printf("flag4 = 0     : %d\n", flag4);
    printf("flag5 = 42    : %d (任何非零值变为 1)\n", flag5);
    printf("flag6 = -1    : %d (负数也是非零,变为 1)\n", flag6);

    /* ======== 2. bool 类型的大小 ======== */
    printf("\n======== 2. bool 类型的大小 ========\n");
    printf("sizeof(bool)      = %zu 字节\n", sizeof(bool));
    printf("sizeof(_Bool)     = %zu 字节\n", sizeof(_Bool));
    printf("sizeof(true)      = %zu 字节 (int类型)\n", sizeof(true));
    printf("sizeof(false)     = %zu 字节 (int类型)\n", sizeof(false));
    printf("说明: true/false 是宏,展开为 1 和 0(int类型)\n");

    /* ======== 3. 在条件语句中使用 bool ======== */
    printf("\n======== 3. 在条件语句中使用 bool ========\n");

    bool condition = true;
    if (condition) {
        printf("if (condition) 为 true 时执行\n");
    } else {
        printf("if (condition) 为 false 时执行\n");
    }

    /* for 循环中使用 bool */
    bool keep_running = true;
    int count = 0;
    printf("while 循环中使用 bool 控制:\n");
    while (keep_running) {
        printf("  迭代 #%d\n", count + 1);
        count++;
        if (count >= 3) {
            keep_running = false;  /* 循环 3 次后退出 */
        }
    }

    /* ======== 4. 从函数返回 bool ======== */
    printf("\n======== 4. 函数返回 bool 类型 ========\n");

    int test_nums[] = {-3, -2, -1, 0, 1, 2, 3, 4, 5};
    int num_count = sizeof(test_nums) / sizeof(test_nums[0]);

    for (int i = 0; i < num_count; i++) {
        int n = test_nums[i];
        printf("数字 %2d: 是正数? %d | 是偶数? %d\n",
               n, is_positive(n), is_even(n));
    }

    /* ======== 5. 任何标量类型都可以转为 bool ======== */
    printf("\n======== 5. 标量类型到 bool 的转换 ========\n");

    /* 整数 -> bool */
    printf("(bool)0    = %d (假)\n", (bool)0);
    printf("(bool)1    = %d (真)\n", (bool)1);
    printf("(bool)100  = %d (真,非零)\n", (bool)100);

    /* 浮点数 -> bool */
    printf("(bool)0.0  = %d (假)\n", (bool)0.0);
    printf("(bool)1.5  = %d (真,非零)\n", (bool)1.5);

    /* 指针 -> bool */
    int dummy_val = 0;
    int *null_ptr = NULL;
    int *valid_ptr = &dummy_val;
    printf("(bool)NULL       = %d (假,空指针)\n", (bool)null_ptr);
    printf("(bool)valid_ptr  = %d (真,非空指针)\n", (bool)valid_ptr);

    /* 字符 -> bool */
    printf("(bool)'\\0' = %d (假,空字符)\n", (bool)'\0');
    printf("(bool)'A'  = %d (真,非空字符)\n", (bool)'A');

    /* ======== 6. 常见布尔模式 ======== */
    printf("\n======== 6. 常见布尔模式 ========\n");

    /* 模式1: 检查标志位 */
    unsigned int flags = 0x05;  /* 二进制: 0101 */
    bool bit0_set = (flags & 0x01) != 0;
    bool bit1_set = (flags & 0x02) != 0;
    bool bit2_set = (flags & 0x04) != 0;
    printf("标志位 0x%02x: bit0=%d, bit1=%d, bit2=%d\n",
           flags, bit0_set, bit1_set, bit2_set);

    /* 模式2: 三元运算符中使用布尔表达式 */
    int value = 15;
    const char *parity = is_even(value) ? "偶数" : "奇数";
    const char *sign = is_positive(value) ? "正数" : "非正数";
    printf("%d 是 %s 和 %s\n", value, parity, sign);

    /* 模式3: 短路求值与布尔运算 */
    bool a = true;
    bool b = false;
    printf("a && b = %d (逻辑与)\n", a && b);
    printf("a || b = %d (逻辑或)\n", a || b);
    printf("!a     = %d (逻辑非)\n", !a);
    printf("a ^ b  = %d (逻辑异或,用 != 模拟)\n", a != b);

    /* 模式4: 布尔值累加(计数满足条件的元素) */
    int numbers[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int even_count = 0;
    for (size_t i = 0; i < sizeof(numbers)/sizeof(numbers[0]); i++) {
        even_count += is_even(numbers[i]); /* true(1)或false(0)累加 */
    }
    printf("\n1~10 中有 %d 个偶数(通过bool累加计数)\n", even_count);

    /* ======== 7. bool 与 printf 格式 ======== */
    printf("\n======== 7. 输出 bool 值的格式 ========\n");
    bool val = true;
    printf("直接输出: bool = %d (用 %%d)\n", val);
    printf("三元输出: bool = %s (用 %%s)\n", val ? "true" : "false");

    /* 注意: 不要用 %s 直接输出 bool,会崩溃!
     * 错误: printf("bool = %s\n", val);  // val 是整数,不是指针!
     */

    return 0;
}

/**
 * 判断一个整数是否为偶数。
 * 返回 bool 类型,让调用者语义更清晰。
 */
bool is_even(int num)
{
    return (num % 2) == 0;
}

/**
 * 判断一个整数是否为正数。
 * bool 返回类型清楚表达了"是/否"的语义。
 */
bool is_positive(int num)
{
    return num > 0;
}
