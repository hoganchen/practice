/*
 * ============================================================
 *  知识点: 基本输入输出（Basic Input and Output）
 *
 *  本文件覆盖以下核心概念:
 *    1. printf() —— 格式化输出到屏幕
 *    2. scanf()  —— 从键盘读取格式化输入
 *    3. getchar() / putchar() —— 字符级别的输入输出
 *    4. 输入缓冲区的概念与常见陷阱
 *
 *  编译指令:
 *    gcc 02_basic_io.c -o 02_basic_io.exe -std=c11 -Wall
 *
 *  运行指令:
 *    ./02_basic_io.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>

int main(void)
{
    /*
     * ============================================
     *  1. printf() —— 格式化输出（Formatted Output）
     * ============================================
     *
     *  printf() 的完整原型:
     *    int printf(const char *format, ...);
     *    返回值: 成功输出的字符数，失败返回负数
     *
     *  格式化字符串包含:
     *    - 普通字符: 直接输出
     *    - 转义序列: 如 \n（换行）、\t（制表符）
     *    - 格式占位符: 如 %d、%f、%c、%s
     */
    printf("===== 1. printf() 格式化输出 =====\n");
    printf("姓名: %s, 年龄: %d, 身高: %.1f cm\n\n", "小明", 18, 175.5);

    /*
     * printf() 的返回值 —— 输出字符的个数
     */
    int chars_written = printf("你好，世界！\n");
    printf("上一行输出了 %d 个字符\n\n", chars_written);

    /*
     * ============================================
     *  2. scanf() —— 格式化输入（Formatted Input）
     * ============================================
     *
     *  scanf() 的完整原型:
     *    int scanf(const char *format, ...);
     *    返回值: 成功读取并赋值的输入项数
     *           如果遇到文件结尾（EOF），返回 EOF（-1）
     *
     *  重要: scanf() 需要传入变量的"地址"（使用 & 运算符）
     *  常见错误: 忘记写 & 会导致程序崩溃（segmentation fault）
     */
    printf("===== 2. scanf() 格式化输入 =====\n");

    int input_age;
    printf("请输入你的年龄: ");
    int result = scanf("%d", &input_age);   /* & 取地址运算符 */

    if (result == 1)
    {
        printf("你输入的年龄是: %d\n\n", input_age);
    }
    else
    {
        printf("输入无效！\n\n");
        /* 清除输入缓冲区中的无效内容 */
        while (getchar() != '\n');
    }

    /*
     * scanf() 读取多个值
     */
    int day, month, year;
    printf("请输入今天的日期 (年 月 日，用空格分隔): ");
    result = scanf("%d %d %d", &year, &month, &day);

    if (result == 3)
    {
        printf("日期: %d年%d月%d日\n\n", year, month, day);
    }
    else
    {
        printf("日期格式错误！\n\n");
        while (getchar() != '\n');
    }

    /*
     * scanf() 读取字符串 —— 注意: 不需要 & 符号
     * 因为数组名本身就是地址（指向第一个元素的指针）
     *
     * 危险: scanf("%s") 不会检查缓冲区大小，可能导致缓冲区溢出！
     * 解决方案: 使用宽度限制，如 %19s 最多读 19 个字符
     */
    char name[20];  /* 分配 20 字节的空间存放字符串 */
    printf("请输入你的名字（最多19个字符）: ");
    scanf("%19s", name);            /* 注意: 这里没有 & */
    printf("你好, %s!\n\n", name);

    /*
     * ============================================
     *  3. getchar() / putchar() —— 字符 IO
     * ============================================
     *
     *  getchar(): 从标准输入读取一个字符
     *    原型: int getchar(void);
     *    返回值: 读取的字符（以 unsigned char 转为 int）
     *            如果遇到文件结尾，返回 EOF（-1）
     *    注意: 返回类型是 int 而不是 char，这样才能容纳 EOF
     *
     *  putchar(): 向标准输出写入一个字符
     *    原型: int putchar(int char);
     *    返回值: 写入的字符，失败返回 EOF
     */

    /* 清空输入缓冲区（因为在 scanf 读取字符串后可能还有换行符残留） */
    while (getchar() != '\n');

    printf("===== 3. getchar() / putchar() 字符 IO =====\n");
    printf("请输入一个字符: ");

    int ch = getchar();      /* 读取一个字符，注意返回类型是 int */

    if (ch != EOF)           /* 检查是否成功读取 */
    {
        printf("你输入的字符是: ");
        putchar(ch);         /* 输出该字符 */
        putchar('\n');       /* 输出换行 */

        printf("该字符的 ASCII 码是: %d (十进制), 0x%X (十六进制)\n\n",
               ch, ch);
    }

    /*
     * 使用 getchar() 读取一整行
     */
    while (getchar() != '\n');  /* 清空缓冲区 */

    printf("===== 使用 getchar() 逐字符读取 =====\n");
    printf("请输入一行文字（以回车结束）:\n");

    char buffer[100] = {0};     /* 初始化为全 0 */
    int i = 0;

    while (i < 99)
    {
        ch = getchar();         /* 读取一个字符 */
        if (ch == '\n' || ch == EOF)
        {
            break;              /* 遇到换行或结尾就停止 */
        }
        buffer[i] = (char)ch;   /* 将 int 转回 char */
        i++;
    }
    buffer[i] = '\0';           /* 字符串必须以 \0 结尾 */

    printf("你输入的是: %s\n", buffer);

    /*
     * ============================================
     *  4. 输入缓冲区陷阱 —— 理解为什么要清空缓冲区
     * ============================================
     *
     *  当使用 scanf("%d") 读取整数后，缓冲区中可能还留有换行符 \n。
     *  如果接着使用 getchar()，它会直接读取这个残留的 \n，而不是等待用户输入。
     *  这就是为什么需要在两种输入方式之间清空缓冲区。
     */
    printf("\n===== 输入缓冲区演示 =====\n");
    printf("总结: scanf 和 getchar 混用时，务必注意缓冲区的状态！\n");
    printf("清空缓冲区的常用方法: while (getchar() != '\\n');\n");

    return 0;
}
