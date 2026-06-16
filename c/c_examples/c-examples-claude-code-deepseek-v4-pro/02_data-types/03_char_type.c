/*
 * ============================================
 * 知识点：字符类型（char）和转义字符
 * 说明：
 *   char 在 C 语言中本质上是一个小整数，
 *   占用 1 字节。它存储的是字符的 ASCII 码。
 *   字符用单引号 '' 括起来。
 *
 * 转义字符：以反斜杠 \ 开头的特殊字符序列
 *   \n — 换行（newline）
 *   \t — 制表符（tab）
 *   \\ — 反斜杠本身
 *   \' — 单引号
 *   \" — 双引号
 *   \0 — 空字符（字符串结束标志）
 *
 * 编译方法：
 *   gcc 03_char_type.c -o 03_char_type
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

int main() {
    // ========== 字符的声明和初始化 ==========
    char c1 = 'A';      // 字符字面量
    char c2 = 65;       // 直接使用 ASCII 码值（A 的 ASCII 码是 65）
    char c3 = '0';      // 字符 '0'，ASCII 码 48

    // ========== 字符与 ASCII 码的相互转换 ==========
    printf("===== 字符与 ASCII 码 =====\n");
    printf("字符 'A' 的 ASCII 码是: %d\n", c1);       // 用 %d 打印整数
    printf("ASCII 码 65 对应的字符是: %c\n", c2);      // 用 %c 打印字符
    printf("字符 '0' 的 ASCII 码是: %d\n", c3);        // 注意：'0' ≠ 0
    printf("零字符 '0' 与 整数 0 的关系: %d = %d + %d\n",
           '0', '0', 0);

    printf("\n===== ASCII 码规律 =====\n");
    // 数字字符连续排列：'0' ~ '9'
    printf("数字 '0'~'9' 的 ASCII 码: %d ~ %d\n", '0', '9');
    // 大写字母连续排列：'A' ~ 'Z'
    printf("大写字母 'A'~'Z' 的 ASCII 码: %d ~ %d\n", 'A', 'Z');
    // 小写字母连续排列：'a' ~ 'z'
    printf("小写字母 'a'~'z' 的 ASCII 码: %d ~ %d\n", 'a', 'z');
    // 大小写字母差值为 32
    printf("大小写字母差值: 'a' - 'A' = %d\n", 'a' - 'A');

    // ========== 字符运算 ==========
    // 字符可以像整数一样参与运算
    printf("\n===== 字符运算 =====\n");

    char ch = 'A';
    // 大写转小写：加 32
    printf("大写 %c 转小写: %c\n", ch, ch + 32);
    // 小写转大写：减 32
    ch = 'm';
    printf("小写 %c 转大写: %c\n", ch, ch - 32);

    // 数字字符转数字：减去 '0'
    char digit = '7';
    int num = digit - '0';  // '7' - '0' = 55 - 48 = 7
    printf("字符 '%c' 转换为整数: %d\n", digit, num);

    // 遍历字母表
    printf("\n===== 遍历字母表 =====\n");
    printf("大写字母: ");
    for (char letter = 'A'; letter <= 'Z'; letter++) {
        printf("%c ", letter);
    }
    printf("\n");

    // ========== 转义字符演示 ==========
    printf("\n===== 转义字符演示 =====\n");

    printf("1. 换行符 \\n: 第一行\n第二行\n");

    printf("2. 制表符 \\t: 列1\t列2\t列3\n");

    printf("3. 反斜杠 \\\\: C:\\Program Files\\\n");

    printf("4. 双引号 \\\": 他说：\"你好！\"\n");

    printf("5. 单引号 \\\': 字符 \'A\'\n");

    printf("6. 响铃 \\a: \a(听到嘟的一声)\n");

    printf("7. 回车 \\r: 回车不换行\r（覆盖前面）\n");

    // ========== signed char vs unsigned char ==========
    printf("\n===== signed vs unsigned char =====\n");
    signed char   sc = -100;    // signed char: -128~127
    unsigned char uc = 200;     // unsigned char: 0~255

    printf("signed char   (-100): %d\n", sc);
    printf("unsigned char (200): %u\n", uc);

    // char 的符号性取决于编译器实现
    printf("默认 char 的 sizeof: %zu 字节\n", sizeof(char));

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. char 是整型，占用 1 字节
 * 2. 用 %c 输出字符，%d 输出 ASCII 码值
 * 3. 字符可参与整数运算
 * 4. 数字字符转数字：减去 '0'
 * 5. 大写字母转小写：加 32
 * 6. 转义字符以 \ 开头，表示特殊含义
 * ============================================
 */
