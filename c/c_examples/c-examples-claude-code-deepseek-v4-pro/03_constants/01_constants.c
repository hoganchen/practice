/*
 * ============================================
 * 知识点：常量
 * 说明：
 *   常量是在程序中不可修改的值。C语言中
 *   定义常量的方式有：
 *   1. #define 宏定义（预处理阶段替换）
 *   2. const 关键字（编译时检查）
 *   3. 枚举常量（enum）
 *   4. 字面量常量（直接写在代码中的值）
 *
 * 编译方法：
 *   gcc 01_constants.c -o 01_constants
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

// ========== #define 定义常量 ==========
/*
 * #define 是预处理指令，在编译前进行文本替换。
 * 优点：不占内存，无类型检查
 * 缺点：无类型检查，调试困难
 * 命名惯例：全大写 + 下划线
 */
#define PI          3.14159
#define MAX_SIZE    100
#define APP_NAME    "C语言示例教程"
#define DEBUG       1

// 带参数的宏（类似函数，但只是文本替换）
#define SQUARE(x)   ((x) * (x))
#define MAX(a, b)   ((a) > (b) ? (a) : (b))

int main() {
    // ========== const 关键字定义常量 ==========
    /*
     * const 修饰的变量不可修改。
     * 优点：有类型检查，可用于调试器
     * 缺点：占用内存
     */
    const int    DAYS_IN_WEEK = 7;
    const double TAX_RATE     = 0.08;
    const char   NEWLINE      = '\n';

    // DAYS_IN_WEEK = 8;  // 错误！const 变量不可修改

    // ========== 字面量常量 ==========
    /*
     * 直接在代码中写的值称为字面量。
     */
    int  age    = 25;              // 25 是整型字面量
    double pi   = 3.14159;         // 3.14159 是浮点字面量
    char grade  = 'A';             // 'A' 是字符字面量
    char name[] = "Alice";         // "Alice" 是字符串字面量

    // 整型字面量的不同进制表示
    int decimal   = 255;           // 十进制
    int octal     = 0377;          // 八进制（以0开头） = 255
    int hex       = 0xFF;          // 十六进制（以0x开头） = 255
    int binary    = 0b11111111;    // 二进制（C23标准，部分编译器支持）

    printf("十进制 255  = %d\n", decimal);
    printf("八进制 0377  = %d\n", octal);
    printf("十六进制 0xFF = %d\n", hex);

    // 整型字面量后缀
    int         i   = 10;          // int
    long        l   = 10L;         // long
    long long   ll  = 10LL;        // long long
    unsigned    u   = 10U;         // unsigned int
    unsigned long ul = 10UL;       // unsigned long

    // 浮点字面量后缀
    float       f   = 3.14f;       // float
    double      d   = 3.14;        // double（默认）
    long double ld  = 3.14L;       // long double

    // ========== 使用 const 常量 ==========
    printf("===== const 常量 =====\n");
    printf("一周有 %d 天\n", DAYS_IN_WEEK);
    printf("税率为 %.1f%%\n", TAX_RATE * 100);

    // ========== 使用 #define 常量 ==========
    printf("\n===== #define 常量 =====\n");
    printf("圆周率 PI = %f\n", PI);
    printf("最大容量 MAX_SIZE = %d\n", MAX_SIZE);
    printf("应用名: %s\n", APP_NAME);

#ifdef DEBUG
    printf("调试模式已开启 (DEBUG = %d)\n", DEBUG);
#endif

    // ========== 带参数的宏 ==========
    printf("\n===== 带参数的宏 =====\n");
    printf("SQUARE(5) = %d\n", SQUARE(5));
    printf("SQUARE(3+2) = %d （注意：宏展开为 ((3+2)*(3+2)) ）\n",
           SQUARE(3+2));
    printf("MAX(10, 20) = %d\n", MAX(10, 20));

    // ========== 字符串字面量拼接 ==========
    printf("\n===== 字符串字面量 =====\n");
    // C语言会自动拼接相邻的字符串字面量
    printf("Hello" ", " "World!\n");

    // 字符串字面量在内存中是只读的
    char *str = "只读字符串";
    // str[0] = 'X';  // 危险！可能崩溃，因为字符串字面量是只读的

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. #define 在预处理阶段做文本替换，无类型检查
 * 2. const 有类型检查，更安全
 * 3. 带参宏注意加括号：((x)*(x)) 而非 (x*x)
 * 4. 字符串字面量是只读的，不要通过指针修改
 * 5. 整型字面量可用不同进制表示
 * 6. 字面量后缀用于指定类型（L、U、F、LL等）
 * ============================================
 */
