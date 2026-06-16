/**
 * ============================================================
 *  知识点: 预定义宏与 #pragma
 *         (Predefined Macros and #pragma)
 *
 *  编译指令: gcc 04_predefined_macros.c -o 04_predefined_macros.exe -std=c11 -Wall
 *  运行指令: ./04_predefined_macros.exe
 *
 *  本文件演示:
 *    1. __FILE__     — 当前源文件名
 *    2. __LINE__     — 当前行号
 *    3. __DATE__     — 编译日期
 *    4. __TIME__     — 编译时间
 *    5. __STDC__     — 是否符合 ANSI C (通常为 1)
 *    6. __STDC_VERSION__ — C 标准版本
 *    7. __func__     — 当前函数名 (C99)
 *    8. #pragma message — 编译时输出信息
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>

/*------------------------------------------------------------------
 *  预定义宏 (Predefined Macros)
 *
 *  这些宏由编译器自动定义, 不需要 #include 任何头文件。
 *  它们提供了关于编译环境和源文件的信息。
 *
 *  常用的预定义宏:
 *    __FILE__          : 当前源文件的完整路径 (字符串)
 *    __LINE__          : 当前行号 (整数)
 *    __DATE__          : 编译日期, 格式 "Mmm dd yyyy" (字符串)
 *    __TIME__          : 编译时间, 格式 "hh:mm:ss" (字符串)
 *    __STDC__          : 如果编译器符合 ANSI C 标准, 值为 1
 *    __STDC_VERSION__  : C 标准版本号:
 *                         199409L = C89  + 修正
 *                         199901L = C99
 *                         201112L = C11
 *    __func__          : 当前函数名 (C99 起支持, 是标识符而非宏)
 *------------------------------------------------------------------*/

/*------------------------------------------------------------------
 *  使用 #pragma 在编译时输出信息
 *
 *  #pragma message("信息") — 在编译时显示一条信息
 *  不同编译器的语法可能略有不同:
 *    GCC:     #pragma message "text"
 *    MSVC:    #pragma message("text")
 *    GCC 也支持: #pragma message("text")
 *
 *  #pragma once — 头文件保护, 确保头文件只被包含一次
 *  (在 .h 文件中使用, 这里演示语法)
 *------------------------------------------------------------------*/

/* 编译时显示一条信息 */
#pragma message("编译 04_predefined_macros.c ...")
#pragma message("C11 模式编译")

/* __FILE__ 展开为当前文件的路径字符串 */
#pragma message("源文件: " __FILE__)

/* 注意: __DATE__ 和 __TIME__ 是字符串, 可以用字符串拼接 */
#pragma message("编译日期: " __DATE__ " " __TIME__)


/*------------------------------------------------------------------
 *  辅助宏: 使用预定义宏输出调试信息
 *------------------------------------------------------------------*/

/* TRACE 宏: 打印源文件位置和当前函数名 */
#define TRACE()                                                      \
    printf("  TRACE: %s:%d 在函数 %s() 中\n",                        \
           __FILE__, __LINE__, __func__)

/* ASSERT 宏: 简单的运行时断言 (带文件名和行号) */
#define ASSERT(cond)                                                 \
    do {                                                             \
        if (!(cond)) {                                               \
            fprintf(stderr,                                          \
                    "断言失败: %s:%d: 条件 \"%s\" 不成立\n",         \
                    __FILE__, __LINE__, #cond);                      \
        }                                                            \
    } while (0)


/*------------------------------------------------------------------
 *  测试函数
 *------------------------------------------------------------------*/

void testFunction1(void)
{
    TRACE();
}

void testFunction2(void)
{
    TRACE();
}

int factorial(int n)
{
    TRACE();
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}


/*------------------------------------------------------------------
 *  主函数
 *------------------------------------------------------------------*/
int main(void)
{
    printf("========================================\n");
    printf("  预定义宏与 #pragma\n");
    printf("========================================\n\n");

    /*--------------------------------------------------------------
     *  1. __FILE__ 和 __LINE__
     *
     *  __FILE__ 是当前源文件的路径字符串
     *  __LINE__ 是当前行号 (整数)
     *  常用于调试和错误报告
     *--------------------------------------------------------------*/
    printf("=== 1. __FILE__ 和 __LINE__ ===\n");

    /* 注意: __LINE__ 的值取决于它在代码中的位置 */
    printf("__FILE__ = \"%s\"\n", __FILE__);
    printf("__LINE__ = %d\n",     __LINE__);   /* 这一行的行号 */
    printf("__LINE__ = %d\n",     __LINE__);   /* 不同行, 不同值 */
    printf("\n");

    /* 使用 ASSERT 宏测试 */
    int val = 5;
    ASSERT(val > 0);     /* 条件成立, 不输出 */
    ASSERT(val < 0);     /* 条件不成立, 输出错误信息 */
    printf("\n");

    /*--------------------------------------------------------------
     *  2. __DATE__ 和 __TIME__
     *
     *  编译时的日期和时间
     *  可用于在程序中显示版本信息
     *--------------------------------------------------------------*/
    printf("=== 2. __DATE__ 和 __TIME__ ===\n");

    printf("__DATE__ = \"%s\"\n", __DATE__);
    printf("__TIME__ = \"%s\"\n", __TIME__);
    printf("\n");

    /* 典型用途: 显示构建信息 */
    printf("构建信息: %s %s\n", __DATE__, __TIME__);
    printf("\n");

    /*--------------------------------------------------------------
     *  3. __STDC__ 和 __STDC_VERSION__
     *
     *  __STDC__: 如果编译器符合 ANSI C 标准, 值为 1
     *  __STDC_VERSION__: C 标准版本号
     *    199409L = C89 + Amendment 1 (1994)
     *    199901L = C99
     *    201112L = C11
     *--------------------------------------------------------------*/
    printf("=== 3. __STDC__ 和 __STDC_VERSION__ ===\n");

    printf("__STDC__         = %d\n", __STDC__);

    /* __STDC_VERSION__ 在某些编译器中可能未定义, 需要先检查 */
#ifdef __STDC_VERSION__
    printf("__STDC_VERSION__ = %ld\n", __STDC_VERSION__);

    /* 根据版本号显示 C 标准 */
    if (__STDC_VERSION__ >= 201112L) {
        printf("=> 编译器支持 C11 或更高版本\n");
    } else if (__STDC_VERSION__ >= 199901L) {
        printf("=> 编译器支持 C99 或更高版本\n");
    } else if (__STDC_VERSION__ >= 199409L) {
        printf("=> 编译器支持 C89 修正版\n");
    } else {
        printf("=> 编译器支持 ANSI C (C89)\n");
    }
#else
    printf("__STDC_VERSION__ 未定义 (可能是 C89 编译器)\n");
#endif
    printf("\n");

    /*--------------------------------------------------------------
     *  4. __func__ (C99)
     *
     *  __func__ 是当前函数的名称, 以字符串形式提供。
     *  注意: __func__ 不是宏, 它是一个隐式定义的标识符。
     *  在 C99 及以后的标准中可用。
     *--------------------------------------------------------------*/
    printf("=== 4. __func__ (C99) ===\n");

    printf("当前在函数: %s()\n", __func__);

    /* 调用测试函数, 查看 TRACE 宏的输出 */
    printf("\n调用 testFunction1:\n");
    testFunction1();

    printf("调用 testFunction2:\n");
    testFunction2();

    printf("调用 factorial(5):\n");
    printf("factorial(5) = %d\n", factorial(5));
    printf("\n");

    /*--------------------------------------------------------------
     *  5. 综合应用: 构建信息打印
     *--------------------------------------------------------------*/
    printf("=== 5. 构建信息 ===\n");

    printf("程序名:    %s\n", __FILE__);
    printf("编译日期:  %s\n", __DATE__);
    printf("编译时间:  %s\n", __TIME__);
    printf("编译标准:  ");

#ifdef __STDC_VERSION__
    switch (__STDC_VERSION__) {
        case 199409L: printf("C89 + 修正\n"); break;
        case 199901L: printf("C99\n"); break;
        case 201112L: printf("C11\n"); break;
        case 201710L: printf("C17\n"); break;
        default:      printf("C标准 %ld\n", __STDC_VERSION__); break;
    }
#else
    printf("ANSI C (C89)\n");
#endif

    printf("编译选项: -std=c11 -Wall\n");
    printf("\n");

    /*--------------------------------------------------------------
     *  6. #pragma 的其他用途 (演示)
     *--------------------------------------------------------------*/
    printf("=== 6. 关于 #pragma ===\n");

    printf("#pragma 是编译器指令, 常用变体:\n");
    printf("  #pragma message(\"text\") — 编译时显示信息\n");
    printf("  #pragma once            — 头文件保护 (替代 #ifndef)\n");
    printf("  #pragma GCC poison XXX  — 禁止使用 XXX 标识符\n");
    printf("  #pragma GCC warning     — 生成警告\n");
    printf("  #pragma GCC error       — 生成错误\n");
    printf("\n");

    printf("#pragma once 示例:\n");
    printf("  #ifndef HEADER_H\n");
    printf("  #define HEADER_H\n");
    printf("  // ... header content ...\n");
    printf("  #endif\n");
    printf("  等价于:\n");
    printf("  #pragma once\n");
    printf("  // ... header content ...\n");

    return 0;
}
