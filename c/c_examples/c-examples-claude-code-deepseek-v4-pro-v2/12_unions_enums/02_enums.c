/**
 * ============================================================
 *  知识点: 枚举 (Enumerations)
 *
 *  编译指令: gcc 02_enums.c -o 02_enums.exe -std=c11 -Wall
 *  运行指令: ./02_enums.exe
 *
 *  本文件演示:
 *    1. enum 的定义与使用
 *    2. 自动赋值 (0, 1, 2...) 与自定义赋值
 *    3. 枚举作为具名常量 (Named Constants)
 *    4. 枚举在 switch-case 中的使用
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>

/*------------------------------------------------------------------
 *  1. 枚举基本定义
 *
 *  枚举是 C 语言中用于定义一组具名整数常量的机制。
 *  默认: 第一个枚举成员的值是 0, 后续依次递增 1。
 *------------------------------------------------------------------*/

/* 最简单的枚举: 一周的天数 */
enum Weekday {
    MON,      /* 默认值 0 */
    TUE,      /* 默认值 1 */
    WED,      /* 默认值 2 */
    THU,      /* 默认值 3 */
    FRI,      /* 默认值 4 */
    SAT,      /* 默认值 5 */
    SUN       /* 默认值 6 */
};

/*------------------------------------------------------------------
 *  2. 使用 typedef 简化枚举类型名
 *------------------------------------------------------------------*/

typedef enum {
    SPRING,   /* 0 */
    SUMMER,   /* 1 */
    AUTUMN,   /* 2 */
    WINTER    /* 3 */
} Season;

/*------------------------------------------------------------------
 *  3. 自定义枚举值
 *
 *  可以显式为枚举成员指定整数值,
 *  未指定值的成员会在前一个成员的基础上递增 1。
 *------------------------------------------------------------------*/

typedef enum {
    ERR_NONE      = 0,      /* 无错误 */
    ERR_FILE      = 1,      /* 文件错误 */
    ERR_MEMORY    = 2,      /* 内存错误 */
    ERR_NETWORK   = 4,      /* 网络错误 (可以故意跳过 3) */
    ERR_TIMEOUT   = 5,      /* 超时错误 (从 ERR_NETWORK+1 递增) */
    ERR_UNKNOWN   = 99      /* 未知错误 */
} ErrorCode;

/*------------------------------------------------------------------
 *  4. 枚举用于位标志
 *
 *  为枚举成员赋值 2 的幂次, 使它们可以作为位标志使用
 *------------------------------------------------------------------*/

typedef enum {
    FLAG_NONE   = 0,        /* 0000 0000 */
    FLAG_READ   = 1 << 0,   /* 0000 0001 */
    FLAG_WRITE  = 1 << 1,   /* 0000 0010 */
    FLAG_EXEC   = 1 << 2,   /* 0000 0100 */
    FLAG_ALL    = 0x07      /* 0000 0111 = 读 | 写 | 执行 */
} Permission;

/*------------------------------------------------------------------
 *  5. 枚举在 switch-case 中的使用
 *
 *  枚举特别适合搭配 switch-case 语句, 使代码更具可读性。
 *------------------------------------------------------------------*/

/* 定义操作类型 */
typedef enum {
    OP_ADD,     /* 加法 */
    OP_SUB,     /* 减法 */
    OP_MUL,     /* 乘法 */
    OP_DIV,     /* 除法 */
    OP_MOD      /* 取模 */
} Operation;

/* 计算器函数: 根据操作类型执行相应运算 */
int calculate(Operation op, int a, int b);


/*------------------------------------------------------------------
 *  6. 枚举的实际应用: 颜色系统
 *------------------------------------------------------------------*/

typedef enum {
    COLOR_RED    = 0xFF0000,
    COLOR_GREEN  = 0x00FF00,
    COLOR_BLUE   = 0x0000FF,
    COLOR_WHITE  = 0xFFFFFF,
    COLOR_BLACK  = 0x000000,
    COLOR_YELLOW = 0xFFFF00,
    COLOR_CYAN   = 0x00FFFF,
    COLOR_MAGENTA= 0xFF00FF
} Color;


/*------------------------------------------------------------------
 *  辅助函数声明
 *------------------------------------------------------------------*/

const char* weekdayToString(enum Weekday day);
const char* seasonToString(Season s);
const char* errorToString(ErrorCode err);


/*------------------------------------------------------------------
 *  主函数
 *------------------------------------------------------------------*/
int main(void)
{
    printf("========================================\n");
    printf("  枚举 (Enumerations)\n");
    printf("========================================\n\n");

    /*--------------------------------------------------------------
     *  1. 枚举默认值
     *--------------------------------------------------------------*/
    printf("--- 枚举默认值 (0, 1, 2, ...) ---\n");
    printf("MON = %d, TUE = %d, WED = %d, THU = %d\n", MON, TUE, WED, THU);
    printf("FRI = %d, SAT = %d, SUN = %d\n", FRI, SAT, SUN);
    printf("枚举默认从 0 开始, 后续依次递增 1\n\n");

    /* 声明枚举变量 */
    enum Weekday today = WED;
    printf("today = WED = %d\n\n", today);

    /*--------------------------------------------------------------
     *  2. 自定义枚举值
     *--------------------------------------------------------------*/
    printf("--- 自定义枚举值 ---\n");
    printf("ERR_NONE    = %d\n", ERR_NONE);
    printf("ERR_FILE    = %d\n", ERR_FILE);
    printf("ERR_MEMORY  = %d\n", ERR_MEMORY);
    printf("ERR_NETWORK = %d\n", ERR_NETWORK);
    printf("ERR_TIMEOUT = %d (自动 = ERR_NETWORK + 1)\n", ERR_TIMEOUT);
    printf("ERR_UNKNOWN = %d\n", ERR_UNKNOWN);
    printf("\n");

    /*--------------------------------------------------------------
     *  3. 枚举用于具名常量
     *
     * 枚举可以替代 #define 来定义一组相关的整数常量。
     * 相比 #define, 枚举在调试器中可以显示名称, 更具可读性。
     *--------------------------------------------------------------*/
    printf("--- 枚举作为具名常量 (颜色) ---\n");
    printf("COLOR_RED    = 0x%06X\n", COLOR_RED);
    printf("COLOR_GREEN  = 0x%06X\n", COLOR_GREEN);
    printf("COLOR_BLUE   = 0x%06X\n", COLOR_BLUE);
    printf("COLOR_WHITE  = 0x%06X\n", COLOR_WHITE);
    printf("COLOR_BLACK  = 0x%06X\n", COLOR_BLACK);
    printf("COLOR_YELLOW = 0x%06X\n", COLOR_YELLOW);
    printf("\n");

    /*--------------------------------------------------------------
     *  4. 枚举在 switch-case 中的使用
     *--------------------------------------------------------------*/
    printf("--- 枚举与 switch-case (计算器) ---\n");

    int a = 20, b = 7;
    printf("a = %d, b = %d\n\n", a, b);

    printf("OP_ADD: %d + %d = %d\n",  a, b, calculate(OP_ADD, a, b));
    printf("OP_SUB: %d - %d = %d\n",  a, b, calculate(OP_SUB, a, b));
    printf("OP_MUL: %d * %d = %d\n",  a, b, calculate(OP_MUL, a, b));
    printf("OP_DIV: %d / %d = %d\n",  a, b, calculate(OP_DIV, a, b));
    printf("OP_MOD: %d %% %d = %d\n", a, b, calculate(OP_MOD, a, b));
    printf("\n");

    /*--------------------------------------------------------------
     *  5. 枚举用于位标志操作
     *--------------------------------------------------------------*/
    printf("--- 枚举作为位标志 ---\n");

    /* 组合权限: 读 + 写 */
    unsigned int myPerm = FLAG_READ | FLAG_WRITE;

    printf("myPerm = FLAG_READ | FLAG_WRITE = 0x%02X\n", myPerm);

    /* 检查是否有执行权限 */
    if (myPerm & FLAG_EXEC) {
        printf("有执行权限\n");
    } else {
        printf("没有执行权限\n");
    }

    /* 检查是否有读取权限 */
    if (myPerm & FLAG_READ) {
        printf("有读取权限\n");
    }

    /* 添加执行权限 */
    myPerm |= FLAG_EXEC;
    printf("添加执行权限后: 0x%02X\n", myPerm);

    /* 检查是否拥有所有权限 */
    if ((myPerm & FLAG_ALL) == FLAG_ALL) {
        printf("拥有全部权限\n");
    }
    printf("\n");

    /*--------------------------------------------------------------
     *  6. 枚举的局限性: 类型安全较弱
     *
     * 在 C 语言中, 枚举本质上就是整数, 可以赋值为任意整数值,
     * 编译器不会做严格的类型检查。
     *--------------------------------------------------------------*/
    printf("--- 枚举的局限性 ---\n");

    enum Weekday day = 100;   /* 编译通过! 枚举本质上是整数 */
    printf("day = 100 (%s)\n\n", weekdayToString(day));

    printf("注意: C 语言中枚举本质上是 int 类型,\n");
    printf("      可以赋任意整数值, 编译器不会报错\n");

    return 0;
}


/* =================================================================
 *  辅助函数实现
 * ================================================================= */

/*------------------------------------------------------------------
 *  calculate: 根据运算符枚举执行计算
 *------------------------------------------------------------------*/
int calculate(Operation op, int a, int b)
{
    switch (op) {
        case OP_ADD:
            return a + b;
        case OP_SUB:
            return a - b;
        case OP_MUL:
            return a * b;
        case OP_DIV:
            if (b == 0) {
                printf("错误: 除数不能为 0!\n");
                return 0;
            }
            return a / b;
        case OP_MOD:
            if (b == 0) {
                printf("错误: 除数不能为 0!\n");
                return 0;
            }
            return a % b;
        default:
            printf("错误: 未知操作!\n");
            return 0;
    }
}

/*------------------------------------------------------------------
 *  weekdayToString: 将星期枚举转换为字符串
 *------------------------------------------------------------------*/
const char* weekdayToString(enum Weekday day)
{
    switch (day) {
        case MON: return "星期一";
        case TUE: return "星期二";
        case WED: return "星期三";
        case THU: return "星期四";
        case FRI: return "星期五";
        case SAT: return "星期六";
        case SUN: return "星期日";
        default:  return "未知";
    }
}

/*------------------------------------------------------------------
 *  seasonToString: 将季节枚举转换为字符串
 *------------------------------------------------------------------*/
const char* seasonToString(Season s)
{
    switch (s) {
        case SPRING: return "春天";
        case SUMMER: return "夏天";
        case AUTUMN: return "秋天";
        case WINTER: return "冬天";
        default:     return "未知";
    }
}

/*------------------------------------------------------------------
 *  errorToString: 将错误码枚举转换为字符串
 *------------------------------------------------------------------*/
const char* errorToString(ErrorCode err)
{
    switch (err) {
        case ERR_NONE:    return "无错误";
        case ERR_FILE:    return "文件错误";
        case ERR_MEMORY:  return "内存错误";
        case ERR_NETWORK: return "网络错误";
        case ERR_TIMEOUT: return "超时错误";
        case ERR_UNKNOWN: return "未知错误";
        default:          return "未定义的错误码";
    }
}
