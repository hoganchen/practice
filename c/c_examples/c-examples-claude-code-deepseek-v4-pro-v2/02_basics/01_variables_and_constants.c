/*
 * ============================================================
 *  知识点: 变量与常量（Variables and Constants）
 *
 *  本文件覆盖以下核心概念:
 *    1. 声明并初始化 int、float、double、char 类型的变量
 *    2. 使用 #define 定义宏常量
 *    3. 使用 const 关键字定义常量
 *    4. 使用 printf() 显示变量的值
 *
 *  编译指令:
 *    gcc 01_variables_and_constants.c -o 01_variables_and_constants.exe -std=c11 -Wall
 *
 *  运行指令:
 *    ./01_variables_and_constants.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>

/*
 *  #define 预处理指令 —— 宏常量（macro constant）
 *  在编译之前，预处理器会将代码中所有的 PI 替换为 3.14159。
 *  宏常量没有类型检查，本质上是文本替换。
 *  按照惯例，宏常量名称使用全大写字母。
 */
#define PI 3.14159

/*
 *  还可以定义宏常量表达式
 */
#define GREETING "欢迎学习C语言变量与常量！"
#define SECONDS_PER_MINUTE 60

int main(void)
{
    /*
     * ============================================
     *  1. 变量声明与初始化（Variable Declaration & Initialization）
     * ============================================
     *
     *  C语言中，变量必须先声明后使用。
     *  声明的语法: 类型 变量名;
     *  建议在声明变量的同时进行初始化，避免使用未初始化的值（垃圾值）。
     */

    /*
     *  int —— 整型（integer），用于存储整数
     *  通常占 4 字节（32 位），范围约 -21亿 ~ +21亿
     */
    int age = 25;               /* 声明并初始化一个整型变量 */
    int year;                   /* 声明但不初始化 —— 此时 year 是"垃圾值" */
    year = 2026;                /* 后续赋值 */

    /*
     *  float —— 单精度浮点型（single-precision floating point）
     *  通常占 4 字节，精度约 6~7 位有效数字
     *  浮点数字面量默认是 double 类型，加 f/F 后缀表示 float
     */
    float temperature = 36.5f;  /* 注意 f 后缀表示 float 类型 */
    float price = 19.99f;

    /*
     *  double —— 双精度浮点型（double-precision floating point）
     *  通常占 8 字节，精度约 15~16 位有效数字
     *  不带后缀的小数字面量默认就是 double 类型
     */
    double pi_value = 3.14159265358979;
    double distance = 384400.5; /* 地月距离（公里） */

    /*
     *  char —— 字符型（character）
     *  通常占 1 字节，存储单个字符
     *  字符用单引号括起来，如 'A'、'9'、'\n'
     *  实际上 char 存储的是字符的 ASCII 码（整数）
     */
    char grade = 'A';           /* 字符 'A'，ASCII 码为 65 */
    char newline = '\n';        /* 换行符也是字符 */
    (void)newline;              /* 抑制未使用变量的警告 */
    char digit = '7';           /* 字符 '7'（不是数字 7） */

    /*
     * ============================================
     *  2. const 关键字 —— 只读变量（read-only variable）
     * ============================================
     *
     *  const 声明的变量在初始化后不能被修改。
     *  与 #define 不同，const 变量有具体的类型，编译器会做类型检查。
     *  const 变量在调试器中可见（宏常量在预处理后就不存在了）。
     */
    const int MAX_STUDENTS = 100;       /* 不可修改的整型常量 */
    const double TAX_RATE = 0.13;       /* 税率常量，13% */
    const char NEWLINE_CHAR = '\n';     /* 字符常量 */
    (void)NEWLINE_CHAR;                 /* 抑制未使用变量的警告 */

    /* 如果尝试修改 const 变量，编译器会报错 */
    /* MAX_STUDENTS = 200; */           /* 错误: 不能修改 const 变量 */

    /*
     * ============================================
     *  3. 使用 printf() 显示变量值
     * ============================================
     *
     *  printf() 的格式化占位符:
     *    %d  —— 以十进制显示 int
     *    %f  —— 以小数形式显示 float/double
     *    %c  —— 显示单个字符
     *    %s  —— 显示字符串
     *    \n  —— 换行
     */

    /* 显示问候语（字符串常量） */
    printf("%s\n", GREETING);

    /* 显示 int 类型变量 */
    printf("年龄 (age): %d\n", age);
    printf("年份 (year): %d\n", year);

    /* 显示 float 类型变量 */
    printf("体温 (temperature): %f\n", temperature);
    printf("价格 (price): %.2f\n", price);   /* %.2f 保留两位小数 */

    /* 显示 double 类型变量 */
    printf("圆周率 (pi_value): %f\n", pi_value);
    printf("圆周率 (pi_value, 高精度): %.10f\n", pi_value);
    printf("地月距离 (distance): %.1f 公里\n", distance);

    /* 显示 char 类型变量 */
    printf("成绩等级 (grade): %c\n", grade);
    printf("字符 (digit): %c\n", digit);

    /* 显示 const 常量 */
    printf("最大学生数 (MAX_STUDENTS): %d\n", MAX_STUDENTS);
    printf("税率 (TAX_RATE): %.0f%%\n", TAX_RATE * 100);  /* %% 输出百分号 */

    /* 显示 #define 宏常量 */
    printf("圆周率 PI: %f\n", PI);
    printf("每秒分钟数: %d\n", SECONDS_PER_MINUTE);

    /*
     * ============================================
     *  4. 变量可以重新赋值
     * ============================================
     */
    age = 26;                   /* 修改变量的值 */
    printf("一年后，年龄变为: %d\n", age);

    temperature = 37.0f;        /* 温度变了 */
    printf("体温变为: %.1f\n", temperature);

    grade = 'B';                /* 成绩更新了 */
    printf("成绩更新为: %c\n", grade);

    return 0;
}
