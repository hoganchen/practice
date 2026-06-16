/*
 * ============================================
 * 知识点：位运算符
 * 说明：
 *   位运算符直接操作整型数据的二进制位，
 *   常用于底层编程、嵌入式开发和性能优化。
 *
 *   &   按位与（AND）
 *   |   按位或（OR）
 *   ^   按位异或（XOR）
 *   ~   按位取反（NOT）
 *   <<  左移
 *   >>  右移
 *
 * 编译方法：
 *   gcc 03_bitwise_operators.c -o 03_bitwise_operators
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

/*
 * 辅助函数：打印整数的二进制表示
 * 从最高位到最低位逐位输出
 */
void print_binary(unsigned int num) {
    // sizeof 返回字节数，乘以8得到位数
    int bits = sizeof(num) * 8;

    for (int i = bits - 1; i >= 0; i--) {
        // (num >> i) & 1 取出第 i 位
        printf("%d", (num >> i) & 1);

        // 每4位加一个空格便于阅读
        if (i % 4 == 0 && i != 0) {
            printf(" ");
        }
    }
}

int main() {
    unsigned int a = 0b1100;  // 二进制：1100，十进制：12
    unsigned int b = 0b1010;  // 二进制：1010，十进制：10

    printf("===== 位运算基础 =====\n\n");
    printf("a = ");
    print_binary(a);
    printf("  (%u)\n", a);

    printf("b = ");
    print_binary(b);
    printf("  (%u)\n\n", b);

    // ========== 按位与 & ==========
    /*
     * 两个位同时为1时结果为1
     *  1100
     * &1010
     * ------
     *  1000
     */
    printf("按位与 &:\n");
    printf("a & b = ");
    print_binary(a & b);
    printf("  (%u)\n\n", a & b);

    // 应用：检查某一位是否为1
    unsigned int flags = 0b1011;   // binary 1011
    unsigned int mask  = 0b0010;  // 检查第2位（从第0位开始）
    if (flags & mask) {
        printf("flags 的第 1 位是 1\n\n");
    } else {
        printf("flags 的第 1 位是 0\n\n");
    }

    // ========== 按位或 | ==========
    /*
     * 至少一个位为1时结果为1
     *  1100
     * |1010
     * ------
     *  1110
     */
    printf("按位或 |:\n");
    printf("a | b = ");
    print_binary(a | b);
    printf("  (%u)\n\n", a | b);

    // 应用：设置某一位为1
    unsigned int value = 0b1000;            // 设置第2位为1
    unsigned int set_mask = 0b0100;
    value = value | set_mask;            // 设置第2位为1
    printf("设置第2位后: ");
    print_binary(value);
    printf("  (%u)\n\n", value);

    // ========== 按位异或 ^ ==========
    /*
     * 两个位不同时结果为1
     *  1100
     * ^1010
     * ------
     *  0110
     */
    printf("按位异或 ^:\n");
    printf("a ^ b = ");
    print_binary(a ^ b);
    printf("  (%u)\n\n", a ^ b);

    // 应用：交换两个数（不需要临时变量）
    unsigned int x = 5, y = 9;
    printf("交换前: x = %u, y = %u\n", x, y);
    x = x ^ y;
    y = x ^ y;  // y = (x^y)^y = x
    x = x ^ y;  // x = (x^y)^x = y
    printf("交换后: x = %u, y = %u\n\n", x, y);

    // ========== 按位取反 ~ ==========
    /*
     * 0变1，1变0
     * ~1100 = ...11110011 (前导位也会取反)
     */
    printf("按位取反 ~:\n");
    printf("~a = ");
    print_binary(~a);
    printf("  (%u)\n\n", ~a);

    // ========== 左移 << ==========
    /*
     * 所有位左移 n 位，右边补0
     * 相当于乘以 2^n
     */
    printf("左移 <<:\n");
    unsigned int c = 5;  // 0101
    printf("c = %u\n", c);
    printf("c << 1 = %2u  (相当于 ×2)\n", c << 1);
    printf("c << 2 = %2u  (相当于 ×4)\n", c << 2);
    printf("c << 3 = %2u  (相当于 ×8)\n", c << 3);
    print_binary(c);
    printf(" << 1 = ");
    print_binary(c << 1);
    printf("\n\n");

    // ========== 右移 >> ==========
    /*
     * 所有位右移 n 位
     * 无符号数：左边补0，相当于除以 2^n
     * 有符号数：行为由编译器决定（逻辑右移或算术右移）
     */
    printf("右移 >>:\n");
    unsigned int d = 40;  // 101000
    printf("d = %u\n", d);
    printf("d >> 1 = %2u  (相当于 ÷2)\n", d >> 1);
    printf("d >> 2 = %2u  (相当于 ÷4)\n", d >> 2);
    printf("d >> 3 = %2u  (相当于 ÷8)\n", d >> 3);
    print_binary(d);
    printf(" >> 1 = ");
    print_binary(d >> 1);
    printf("\n\n");

    // ========== 实际应用：掩码操作 ==========
    printf("===== 掩码操作综合示例 =====\n");

    // 使用位来表示权限：读(4) 写(2) 执行(1)
    unsigned int READ   = 1 << 2;  // 100 = 4
    unsigned int WRITE  = 1 << 1;  // 010 = 2
    unsigned int EXEC   = 1 << 0;  // 001 = 1

    unsigned int permissions = READ | WRITE;  // 用户有读写权限

    printf("权限位: ");
    print_binary(permissions);
    printf("\n");

    printf("有读权限?   %s\n", permissions & READ  ? "是" : "否");
    printf("有写权限?   %s\n", permissions & WRITE ? "是" : "否");
    printf("有执行权限? %s\n", permissions & EXEC  ? "是" : "否");

    // 添加执行权限
    permissions |= EXEC;
    printf("\n添加执行权限后: ");
    print_binary(permissions);
    printf("\n");
    printf("有执行权限? %s\n", permissions & EXEC ? "是" : "否");

    // 移除写权限
    permissions &= ~WRITE;
    printf("\n移除写权限后: ");
    print_binary(permissions);
    printf("\n");
    printf("有写权限?   %s\n", permissions & WRITE ? "是" : "否");

    // ========== 位运算的应用：判断奇偶 ==========
    printf("\n===== 位运算应用：奇偶判断 =====\n");
    for (int i = 0; i < 5; i++) {
        // 最低位为1表示奇数
        printf("%d 是 %s\n", i, i & 1 ? "奇数" : "偶数");
    }

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. & 按位与：清零或检查位
 * 2. | 按位或：设置位为1
 * 3. ^ 按位异或：翻转位、交换值
 * 4. ~ 按位取反：翻转所有位
 * 5. << 左移：相当于乘以 2^n
 * 6. >> 右移：无符号相当于除以 2^n
 * 7. 位运算常用于权限管理、标志位、嵌入式开发
 * ============================================
 */
