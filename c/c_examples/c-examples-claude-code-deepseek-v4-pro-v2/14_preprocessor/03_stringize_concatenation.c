/**
 * ============================================================
 *  知识点: 字符串化与符号拼接运算符
 *         (Stringize and Token-Pasting Operators)
 *
 *  编译指令: gcc 03_stringize_concatenation.c -o 03_stringize_concatenation.exe -std=c11 -Wall
 *  运行指令: ./03_stringize_concatenation.exe
 *
 *  本文件演示:
 *    1. # 运算符 (Stringize): 将宏参数转换为字符串字面量
 *    2. ## 运算符 (Token Pasting): 将多个符号拼接为一个符号
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>

/*==================================================================
 *  1. # 运算符 — 字符串化 (Stringize)
 *
 *  在函数宏中, 在参数前加 # 会将参数转换为带双引号的字符串字面量。
 *  例如: #define STR(x) #x  => STR(hello) 展开为 "hello"
 *
 *  注意:
 *    - # 只能用于函数宏的参数
 *    - 结果会自动加双引号, 字符串中的特殊字符会自动转义
 *    - 参数中的空白字符 (空格、制表符) 会被压缩为一个空格
 *==================================================================*/

/* 最基本的字符串化宏 */
#define STRINGIFY(x)    #x

/* 带格式化输出的字符串化宏: 打印变量名和值 */
#define PRINT_INT(x)    printf(#x " = %d\n", x)
#define PRINT_FLOAT(x)  printf(#x " = %.2f\n", x)
#define PRINT_STR(x)    printf(#x " = \"%s\"\n", x)

/* 更通用的打印宏 */
#define PRINT_VAL(fmt, x)   printf(#x " = " fmt "\n", x)

/* 调试打印宏: 自动显示表达式文本和结果 */
#define DEBUG_EXPR(expr)    printf("  " #expr " = %d\n", expr)

/*==================================================================
 *  2. ## 运算符 — 符号拼接 (Token Pasting)
 *
 *  ## 将其两侧的符号拼接为一个新的符号。
 *  拼接后的符号必须在代码中有意义 (变量名、函数名、类型名等)。
 *
 *  常用于:
 *    - 生成一系列相关的变量名或函数名
 *    - 减少重复代码
 *==================================================================*/

/* 生成变量名的宏 */
#define MAKE_VAR(name, num)  name ## num

/* 生成 getter 函数名的宏 */
#define GETTER(struct_name, field)  get_ ## struct_name ## _ ## field

/* 定义结构体并生成访问函数的宏 */
#define DEFINE_POINT(type_prefix, type)                    \
    typedef struct {                                       \
        type x;                                            \
        type y;                                            \
    } Point_ ## type_prefix;                               \
                                                           \
    static inline type GETTER(point, type_prefix ## _x)(   \
            const Point_ ## type_prefix *p) {              \
        return p->x;                                       \
    }                                                      \
                                                           \
    static inline type GETTER(point, type_prefix ## _y)(   \
            const Point_ ## type_prefix *p) {              \
        return p->y;                                       \
    }

/* 使用宏生成多个类型的 Point 结构体和 getter 函数 */
DEFINE_POINT(int, int)
DEFINE_POINT(dbl, double)
DEFINE_POINT(flt, float)

/*==================================================================
 *  3. 高级应用: 自动生成枚举到字符串的转换
 *==================================================================*/

/* 定义枚举, 并同时生成 to_string 函数 */
#define DEFINE_ERROR_ENUM                          \
    ENUM_ENTRY(ERR_NONE,    "无错误")               \
    ENUM_ENTRY(ERR_FILE,    "文件错误")             \
    ENUM_ENTRY(ERR_MEMORY,  "内存错误")             \
    ENUM_ENTRY(ERR_NETWORK, "网络错误")             \
    ENUM_ENTRY(ERR_TIMEOUT, "超时错误")

/* 生成枚举定义 */
#define ENUM_ENTRY(name, desc)  name,
typedef enum {
    DEFINE_ERROR_ENUM
    ERR_COUNT
} ErrorCode;
#undef ENUM_ENTRY

/* 生成枚举到字符串的映射表 */
#define ENUM_ENTRY(name, desc)  [name] = desc,
static const char *ERROR_NAMES[] = {
    DEFINE_ERROR_ENUM
};
#undef ENUM_ENTRY

/* 生成 switch-case 函数 (另一种方式) */
const char* errorToString(ErrorCode err)
{
    if (err >= 0 && err < ERR_COUNT) {
        return ERROR_NAMES[err];
    }
    return "未知错误";
}


/*------------------------------------------------------------------
 *  主函数
 *------------------------------------------------------------------*/
int main(void)
{
    printf("========================================\n");
    printf("  # 与 ## 运算符\n");
    printf("========================================\n\n");

    /*--------------------------------------------------------------
     *  1. # 运算符: 字符串化
     *--------------------------------------------------------------*/
    printf("=== 1. # 运算符: 字符串化 ===\n\n");

    /* 基本字符串化 */
    printf("STRINGIFY(hello)      = \"%s\"\n", STRINGIFY(hello));
    printf("STRINGIFY(123 + 456)  = \"%s\"\n", STRINGIFY(123 + 456));
    printf("STRINGIFY(x == y)     = \"%s\"\n", STRINGIFY(x == y));
    printf("\n");

    /* 使用 PRINT_INT 宏: 自动打印变量名和值 */
    int value = 42;
    double pi = 3.14159;
    char name[] = "Alice";

    PRINT_INT(value);
    PRINT_FLOAT(pi);
    PRINT_STR(name);
    printf("\n");

    /* 使用 PRINT_VAL 通用宏 */
    PRINT_VAL("%d", value);
    PRINT_VAL("%.4f", pi);
    printf("\n");

    /* # 运算符在调试中的用途: 显示表达式 */
    int a = 10, b = 20;
    printf("调试表达式:\n");
    DEBUG_EXPR(a + b);
    DEBUG_EXPR(a * b);
    DEBUG_EXPR((a > b) ? a : b);
    printf("\n");

    /* 字符串化会自动转义特殊字符 */
    printf("STRINGIFY(x \"y\" z) = \"%s\"\n", STRINGIFY(x "y" z));
    printf("STRINGIFY(a \\ b)   = \"%s\"\n", STRINGIFY(a \ b));
    printf("\n");

    /*--------------------------------------------------------------
     *  2. ## 运算符: 符号拼接
     *--------------------------------------------------------------*/
    printf("=== 2. ## 运算符: 符号拼接 ===\n\n");

    /* 生成变量名 */
    int var1 = 100;
    int var2 = 200;
    int var3 = 300;

    printf("MAKE_VAR(var, 1) = %d\n", MAKE_VAR(var, 1));  /* 展开为 var1 */
    printf("MAKE_VAR(var, 2) = %d\n", MAKE_VAR(var, 2));  /* 展开为 var2 */
    printf("MAKE_VAR(var, 3) = %d\n", MAKE_VAR(var, 3));  /* 展开为 var3 */
    printf("\n");

    /* 使用 DEFINE_POINT 宏生成的结构体 */
    printf("使用宏生成的结构体和 getter 函数:\n");

    Point_int p1 = { 10, 20 };
    Point_dbl p2 = { 3.5, 7.2 };
    Point_flt p3 = { 1.5f, 2.5f };

    /* 这里 GETTER(point, int_x) 展开为 get_point_int_x */
    printf("p1.x = %d\n", GETTER(point, int_x)(&p1));
    printf("p1.y = %d\n", GETTER(point, int_y)(&p1));
    printf("p2.x = %.1f\n", GETTER(point, dbl_x)(&p2));
    printf("p2.y = %.1f\n", GETTER(point, dbl_y)(&p2));
    printf("p3.x = %.1f\n", GETTER(point, flt_x)(&p3));
    printf("p3.y = %.1f\n", GETTER(point, flt_y)(&p3));
    printf("\n");

    printf("如果没有 ## 宏, 需要为每种类型手工编写重复代码\n\n");

    /*--------------------------------------------------------------
     *  3. X-Macro 技法: 枚举 + 字符串映射
     *--------------------------------------------------------------*/
    printf("=== 3. X-Macro: 自动生成枚举与字符串映射 ===\n\n");

    printf("各错误码:\n");
    for (int i = 0; i < ERR_COUNT; i++) {
        printf("  %d => %s\n", i, errorToString((ErrorCode)i));
    }
    printf("\n");

    /* 使用枚举值 */
    ErrorCode err = ERR_FILE;
    printf("错误码 %d 对应的描述: %s\n", err, errorToString(err));
    printf("\n");

    /*--------------------------------------------------------------
     *  4. # 和 ## 结合使用
     *--------------------------------------------------------------*/
    printf("=== 4. # 和 ## 结合使用 ===\n\n");

    /* 定义一个宏: 生成变量并打印其值 */
    #define CREATE_AND_PRINT(type, name, value)                \
        type name = value;                                     \
        printf("变量 " #name " = " #value ", 实际值 = %d\n",   \
               name);

    CREATE_AND_PRINT(int, score, 95);
    CREATE_AND_PRINT(int, count, 100);

    return 0;
}
