/*
 * ============================================
 * 知识点：位操作应用
 * 说明：
 *   位操作在嵌入式编程、系统编程、性能
 *   优化中非常常见。本示例展示常见的位
 *   操作技巧和应用场景。
 *
 *   基本位运算：
 *   &  按位与     |  按位或
 *   ^  按位异或   ~  按位取反
 *   << 左移      >> 右移
 *
 * 编译方法：
 *   gcc 01_bit_operations.c -o 01_bit_operations
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdint.h>  // 固定宽度整型
#include <limits.h>

// 辅助：打印二进制
void print_bits(unsigned int x) {
    int bits = sizeof(x) * 8;
    for (int i = bits - 1; i >= 0; i--) {
        printf("%d", (x >> i) & 1);
        if (i % 4 == 0 && i != 0) printf("_");
    }
}

// ========== 位操作常用宏 ==========
#define BIT(n)          (1UL << (n))        // 第 n 位
#define BIT_SET(x, n)   ((x) |= BIT(n))     // 设置第 n 位为 1
#define BIT_CLEAR(x, n) ((x) &= ~BIT(n))    // 设置第 n 位为 0
#define BIT_TOGGLE(x,n) ((x) ^= BIT(n))     // 翻转第 n 位
#define BIT_CHECK(x, n) (((x) >> (n)) & 1)  // 检查第 n 位
#define BIT_IS_SET(x,n) (((x) & BIT(n)) != 0)  // 第 n 位是否为 1

int main() {
    printf("===== 位操作技巧 =====\n\n");

    // ========== 基本位操作 ==========
    printf("--- 基本位操作 ---\n");
    unsigned int reg = 0;

    printf("初始:        ");
    print_bits(reg);
    printf("\n");

    BIT_SET(reg, 3);    // 设置第 3 位
    printf("设置第3位:   ");
    print_bits(reg);
    printf("  (%u)\n", reg);

    BIT_SET(reg, 5);    // 设置第 5 位
    printf("设置第5位:   ");
    print_bits(reg);
    printf("  (%u)\n", reg);

    BIT_CLEAR(reg, 3);  // 清除第 3 位
    printf("清除第3位:   ");
    print_bits(reg);
    printf("  (%u)\n", reg);

    BIT_TOGGLE(reg, 0); // 翻转第 0 位
    printf("翻转第0位:   ");
    print_bits(reg);
    printf("  (%u)\n", reg);

    printf("\n检查第5位: %s\n",
           BIT_IS_SET(reg, 5) ? "1" : "0");
    printf("检查第0位: %s\n",
           BIT_IS_SET(reg, 0) ? "1" : "0");

    // ========== 标志位管理 ==========
    printf("\n--- 标志位管理 ---\n");

    // 定义标志
    enum {
        FLAG_READ   = 1 << 0,  // 001
        FLAG_WRITE  = 1 << 1,  // 010
        FLAG_EXEC   = 1 << 2,  // 100
        FLAG_ALL    = FLAG_READ | FLAG_WRITE | FLAG_EXEC
    };

    unsigned int flags = 0;

    // 设置多个标志
    flags |= FLAG_READ | FLAG_WRITE;
    printf("权限: %s%s%s\n",
           flags & FLAG_READ  ? "读 " : "",
           flags & FLAG_WRITE ? "写 " : "",
           flags & FLAG_EXEC  ? "执行" : "");

    // 添加标志
    flags |= FLAG_EXEC;
    printf("添加执行: %s%s%s\n",
           flags & FLAG_READ  ? "读 " : "",
           flags & FLAG_WRITE ? "写 " : "",
           flags & FLAG_EXEC  ? "执行" : "");

    // 检查是否有多个标志
    if ((flags & (FLAG_READ | FLAG_WRITE)) ==
        (FLAG_READ | FLAG_WRITE)) {
        printf("有读写权限\n");
    }

    // 移除标志
    flags &= ~FLAG_WRITE;
    printf("移除写:   %s%s%s\n",
           flags & FLAG_READ  ? "读 " : "",
           flags & FLAG_WRITE ? "写 " : "",
           flags & FLAG_EXEC  ? "执行" : "");

    // ========== 位操作技巧 ==========
    printf("\n--- 常见位操作技巧 ---\n");

    unsigned int x = 0b10110100;  // binary 10110100
    printf("x = ");
    print_bits(x);
    printf("  (%u)\n", x);

    // 1. 判断奇偶：x & 1
    printf("\n1. 判断奇偶: x & 1\n");
    printf("   %d 是 %s\n", 5, (5 & 1) ? "奇数" : "偶数");
    printf("   %d 是 %s\n", 6, (6 & 1) ? "奇数" : "偶数");

    // 2. 判断 2 的幂：x & (x-1)
    printf("\n2. 判断 2 的幂: x & (x-1) == 0\n");
    printf("   %d: %s\n", 8, (8 & (8-1)) == 0 ? "是2的幂" : "不是");
    printf("   %d: %s\n", 10, (10 & (10-1)) == 0 ? "是2的幂" : "不是");

    // 3. 取最低位的1: x & (-x)
    int y = 40;  // 101000
    printf("\n3. 取出最低位的1: x & (-x)\n");
    printf("   %d & (-%d) = %d\n", y, y, y & (-y));

    // 4. 交换两个数（不用临时变量）
    printf("\n4. 异或交换: a ^= b ^= a ^= b\n");
    int a = 5, b = 7;
    printf("   交换前: a=%d, b=%d\n", a, b);
    a ^= b; b ^= a; a ^= b;
    printf("   交换后: a=%d, b=%d\n", a, b);

    // 5. 计算 1 的个数
    printf("\n5. 计算二进制中 1 的个数\n");
    unsigned int n = 0b11011010;  // binary 11011010
    int count = 0;
    unsigned int temp = n;
    while (temp) {
        temp &= (temp - 1);  // 清除最低位的 1
        count++;
    }
    printf("   0x%X 中有 %d 个 1\n", n, count);

    // 6. 取模 2^n 的快速方法
    printf("\n6. 快速取模 2^n: x & (n-1)\n");
    printf("   37 %% 8 = %d\n", 37 & 7);  // 等价于 37 % 8

    // 7. 符号判断
    printf("\n7. 符号判断\n");
    int s1 = 42, s2 = -10;
    printf("   %d 是%s数\n", s1, (s1 >> (sizeof(int)*8-1)) & 1 ?
           "负" : "正");
    printf("   %d 是%s数\n", s2, (s2 >> (sizeof(int)*8-1)) & 1 ?
           "负" : "正");

    // ========== 字节提取和组合 ==========
    printf("\n--- 字节操作 ---\n");

    uint32_t value = 0x12345678;

    // 提取各字节
    uint8_t byte0 = (value >> 24) & 0xFF;
    uint8_t byte1 = (value >> 16) & 0xFF;
    uint8_t byte2 = (value >> 8)  & 0xFF;
    uint8_t byte3 = value & 0xFF;

    printf("0x%08X 的各个字节:\n", value);
    printf("  byte3 = 0x%02X (最低字节)\n", byte3);
    printf("  byte2 = 0x%02X\n", byte2);
    printf("  byte1 = 0x%02X\n", byte1);
    printf("  byte0 = 0x%02X (最高字节)\n", byte0);

    // 组合字节
    uint32_t combined = (byte0 << 24) | (byte1 << 16) |
                        (byte2 << 8)  | byte3;
    printf("重新组合: 0x%08X\n", combined);

    // ========== RGB 颜色操作 ==========
    printf("\n--- RGB 颜色操作 ---\n");

    // RGB565: R(5位) G(6位) B(5位)
    uint16_t rgb565 = 0;
    unsigned int r = 31, g = 63, blue = 31;  // 最大亮度

    rgb565 = (r << 11) | (g << 5) | blue;
    printf("RGB565(31,63,31) = 0x%04X\n", rgb565);

    // 提取 RGB 分量
    r = (rgb565 >> 11) & 0x1F;
    g = (rgb565 >> 5)  & 0x3F;
    blue = rgb565 & 0x1F;
    printf("提取结果: R=%d, G=%d, B=%d\n", r, g, blue);

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 位操作用于高效管理标志位和状态
 * 2. x & (x-1) 清除最低位的1
 * 3. x & (-x)  取出最低位的1
 * 4. x & 1 判断奇偶
 * 5. 异或可用于交换两个值
 * 6. 位移 + 掩码实现字节提取和组合
 * 7. 位操作在嵌入式、网络协议中大量使用
 * ============================================
 */
