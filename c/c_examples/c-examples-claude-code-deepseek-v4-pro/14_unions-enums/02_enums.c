/*
 * ============================================
 * 知识点：枚举（enum）
 * 说明：
 *   枚举用于定义一组命名的整型常量，
 *   提高代码的可读性和类型安全。
 *
 *   enum 的规则：
 *   1. 默认从 0 开始递增
 *   2. 可以指定特定的值
 *   3. 后续值在上一个值基础上递增
 *   4. 在 C 中 enum 实际上是 int 类型
 *
 * 编译方法：
 *   gcc 02_enums.c -o 02_enums
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

// ========== 基本枚举 ==========
// 默认值：SUN=0, MON=1, TUE=2, ..., SAT=6
enum Weekday {
    SUN,     // 0
    MON,     // 1
    TUE,     // 2
    WED,     // 3
    THU,     // 4
    FRI,     // 5
    SAT      // 6
};

// ========== 指定值 ==========
enum Color {
    RED   = 1,
    GREEN = 2,
    BLUE  = 4,  // 可用于位运算
    YELLOW = RED | GREEN,
    WHITE  = RED | GREEN | BLUE
};

// ========== 自动递增 ==========
enum Month {
    JAN = 1,  // 1
    FEB,      // 2
    MAR,      // 3
    APR,      // 4
    MAY,      // 5
    JUN,      // 6
    JUL,      // 7
    AUG,      // 8
    SEP,      // 9
    OCT,      // 10
    NOV,      // 11
    DEC       // 12
};

// ========== 枚举用于状态码 ==========
enum Status {
    SUCCESS       = 0,
    ERROR_NULL    = -1,
    ERROR_IO      = -2,
    ERROR_MEMORY  = -3,
    ERROR_PARAM   = -4
};

// ========== 枚举用于标志位 ==========
enum Permission {
    PERM_NONE  = 0,       // 000
    PERM_READ  = 1 << 0,  // 001
    PERM_WRITE = 1 << 1,  // 010
    PERM_EXEC  = 1 << 2   // 100
};

// ========== 枚举用于方向 ==========
enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT
};

// ========== 枚举的辅助函数 ==========
const char* weekday_name(enum Weekday day) {
    switch (day) {
        case SUN: return "星期日";
        case MON: return "星期一";
        case TUE: return "星期二";
        case WED: return "星期三";
        case THU: return "星期四";
        case FRI: return "星期五";
        case SAT: return "星期六";
        default:  return "未知";
    }
}

const char* month_name(enum Month month) {
    static const char *names[] = {
        "", "一月", "二月", "三月", "四月", "五月", "六月",
        "七月", "八月", "九月", "十月", "十一月", "十二月"
    };
    if (month >= 1 && month <= 12) {
        return names[month];
    }
    return "未知";
}

int main() {
    // ========== 基本使用 ==========
    printf("===== 枚举基本使用 =====\n");

    enum Weekday today = WED;
    printf("今天: %s (值=%d)\n", weekday_name(today), today);

    // 枚举在 switch 中非常有用
    enum Weekday day = SAT;
    switch (day) {
        case SAT:
        case SUN:
            printf("周末！\n");
            break;
        case MON:
        case TUE:
        case WED:
        case THU:
        case FRI:
            printf("工作日\n");
            break;
    }

    // ========== 枚举的值 ==========
    printf("\n===== 枚举的值 =====\n");

    printf("周几的值:\n");
    printf("  SUN = %d\n", SUN);
    printf("  MON = %d\n", MON);
    printf("  TUE = %d\n", TUE);
    printf("  WED = %d\n", WED);
    printf("  THU = %d\n", THU);
    printf("  FRI = %d\n", FRI);
    printf("  SAT = %d\n", SAT);

    // 指定值的枚举
    printf("\n颜色值:\n");
    printf("  RED   = %d\n", RED);
    printf("  GREEN = %d\n", GREEN);
    printf("  BLUE  = %d\n", BLUE);
    printf("  YELLOW = RED|GREEN = %d\n", YELLOW);

    // 自动递增
    printf("\n月份值:\n");
    printf("  JAN = %d, FEB = %d, MAR = %d\n", JAN, FEB, MAR);
    printf("  DEC = %d\n", DEC);

    // ========== 枚举与整型的互操作 ==========
    printf("\n===== 枚举与整型 =====\n");

    // 枚举实际上是 int，可以赋值整数
    enum Weekday d = 3;  // 等价于 WED
    printf("d = 3, 名称: %s\n", weekday_name(d));

    // 枚举在算术运算中自动转为 int
    enum Weekday next = (today + 1) % 7;
    printf("明天: %s (值=%d)\n", weekday_name(next), next);

    // ========== 枚举用于状态码 ==========
    printf("\n===== 状态码 =====\n");

    enum Status result = SUCCESS;
    printf("成功状态码: %d\n", result);
    printf("错误码: NULL=%d, IO=%d, MEMORY=%d, PARAM=%d\n",
           ERROR_NULL, ERROR_IO, ERROR_MEMORY, ERROR_PARAM);

    // ========== 枚举用于权限 ==========
    printf("\n===== 权限标志 =====\n");

    // 组合权限
    int perms = PERM_READ | PERM_WRITE;
    printf("权限: %s%s%s\n",
           (perms & PERM_READ)  ? "读 " : "",
           (perms & PERM_WRITE) ? "写 " : "",
           (perms & PERM_EXEC)  ? "执行" : "");

    // 添加权限
    perms |= PERM_EXEC;
    printf("添加执行后: %s%s%s\n",
           (perms & PERM_READ)  ? "读 " : "",
           (perms & PERM_WRITE) ? "写 " : "",
           (perms & PERM_EXEC)  ? "执行" : "");

    // ========== 枚举的遍历（注意：C不支持直接遍历） ==========
    printf("\n===== 枚举遍历 =====\n");

    printf("一周七天:\n");
    for (int i = SUN; i <= SAT; i++) {
        printf("  %s\n", weekday_name((enum Weekday)i));
    }

    // ========== typedef 配合枚举 ==========
    printf("\n===== typedef + enum =====\n");

    // 注意：Windows 头文件中已定义了 FALSE/TRUE 宏
    // 这里改用不同的枚举名避免冲突
    typedef enum { FALSE, TRUE } Bool;

    Bool flag = TRUE;
    if (flag) {
        printf("flag 为真 (值=%d)\n", flag);
    }

    // 更现代的风格
    typedef enum {
        STATE_IDLE,
        STATE_RUNNING,
        STATE_PAUSED,
        STATE_STOPPED
    } State;

    State current = STATE_RUNNING;
    printf("当前状态: %d\n", current);

    if (current == STATE_RUNNING) {
        printf("程序正在运行\n");
    }

    // ========== 枚举 vs #define 常量 ==========
    printf("\n===== 枚举 vs #define =====\n");

    printf("枚举的优点:\n");
    printf("1. 有作用域（在 enum 内）\n");
    printf("2. 可以用在 switch 中\n");
    printf("3. 调试器可以显示名称\n");
    printf("4. 可以声明枚举变量\n");

    printf("\n#define 宏的优点:\n");
    printf("1. 任何时候都有效（不仅是 int）\n");
    printf("2. 可以用于条件编译\n");
    printf("3. 可以定义任意类型的常量\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 枚举定义命名的整型常量
 * 2. 默认从 0 开始递增，可指定值
 * 3. 枚举是 int 类型，可与整数互操作
 * 4. 适合 switch 语句
 * 5. 常用于状态码、标志位、选项
 * 6. typedef 枚举可以简化类型名
 * ============================================
 */
