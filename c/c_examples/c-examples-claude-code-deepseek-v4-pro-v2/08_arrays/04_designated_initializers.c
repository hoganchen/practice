/**
 * ============================================================
 * 知识点: 指定初始化器 (Designated Initializers) - C99
 *
 * 指定初始化器允许在初始化数组或结构体时,明确指出要初始化
 * 哪一个元素或成员。这大大提高了代码的可读性和可维护性。
 *
 * 数组指定初始化:
 *   int arr[5] = {[1]=10, [3]=30};
 *   等价于: arr[0]=0, arr[1]=10, arr[2]=0, arr[3]=30, arr[4]=0
 *
 * 结构体指定初始化:
 *   struct S s = {.name="Alice", .age=25};
 *
 * 核心优点:
 *   1. 可读性: 清楚知道哪个成员被初始化为什么值
 *   2. 可维护性: 结构体增加/删除成员时,初始化代码不易出错
 *   3. 稀疏数组: 只需初始化需要的元素
 *   4. 顺序无关: 可以任意顺序初始化
 *
 * 编译指令:
 *   gcc 04_designated_initializers.c -o 04_designated_initializers.exe -std=c11 -Wall
 * 运行:
 *   ./04_designated_initializers.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <string.h>  /* 用于 strcmp 比较 */

/* ======== 结构体定义 ======== */

/** 日期结构体 */
struct Date {
    int year;
    int month;
    int day;
};

/** 学生结构体(用于演示嵌套指定初始化) */
struct Student {
    int id;
    char name[50];
    float score;
    struct Date birth;     /* 嵌套结构体 */
    char grade;            /* 'A', 'B', 'C', 'D', 'F' */
    int enrolled;          /* 布尔值: 是否在读 */
};

/** 颜色枚举 */
enum Color {
    COLOR_RED,
    COLOR_GREEN,
    COLOR_BLUE,
    COLOR_YELLOW,
    COLOR_WHITE,
    COLOR_BLACK
};

/** 点结构体(用于二维坐标) */
struct Point {
    int x;
    int y;
};

/** 多边形结构体(包含固定大小的点数组) */
struct Polygon {
    int count;
    struct Point vertices[10]; /* 最多10个顶点 */
};

/** 配置结构体(演示默认值模式) */
struct Config {
    int    width;
    int    height;
    int    fullscreen;
    float  volume;
    char   theme[20];
    int    enable_vsync;
};

/** 月份名称映射 */
struct MonthInfo {
    int id;
    const char *name;
    int days;
};

int main(void)
{
    printf("========================================\n");
    printf("  指定初始化器 (Designated Initializers)\n");
    printf("========================================\n\n");

    /* ======== 1. 数组的指定初始化 ======== */
    printf("======== 1. 数组指定初始化 ========\n");

    /* 指定初始化: 明确指定索引 */
    /* 传统方式需要在注释中标注每个值的位置:int arr[5] = {0,10,0,30,0}; */
    int designated[5] = {[1] = 10, [3] = 30};

    printf("int designated[5] = {[1]=10, [3]=30};\n");
    printf("结果: ");
    for (int i = 0; i < 5; i++) {
        printf("[%d]=%d ", i, designated[i]);
    }
    printf("\n");
    printf("说明: 未指定的元素自动初始化为0\n\n");

    /* 不连续索引 */
    int sparse[100] = {[0] = 1, [50] = 50, [99] = 99};
    printf("稀疏数组(只在关键位置赋值):\n");
    printf("  sparse[0]  = %d\n", sparse[0]);
    printf("  sparse[50] = %d\n", sparse[50]);
    printf("  sparse[99] = %d\n", sparse[99]);
    printf("  sparse[1]  = %d (其他元素自动为0)\n\n", sparse[1]);

    /* 指定索引与常规初始化混合 */
    int mixed[6] = {10, 20, [3] = 30, 40};
    printf("混合初始化: int mixed[6] = {10, 20, [3]=30, 40};\n");
    for (int i = 0; i < 6; i++) {
        printf("  [%d]=%d", i, mixed[i]);
    }
    printf("\n");
    printf("说明: 10和20给[0]和[1],[3]=30, 40给[4];[2]和[5]为0\n\n");

    /* ======== 2. 结构体的指定初始化 ======== */
    printf("======== 2. 结构体指定初始化 ========\n");

    /* 传统方式: 依赖成员顺序,容易出错 */
    struct Student s1 = {1001, "张三", 92.5f, {2000, 5, 15}, 'A', 1};
    /* 如果结构体成员顺序改变,初始化就会出错 */

    /* 指定初始化: 按名称初始化,顺序无关 */
    struct Student s2 = {
        .id      = 1002,
        .name    = "李四",
        .score   = 88.5f,
        .grade   = 'B',
        .enrolled = 1,
        .birth   = {.year = 2001, .month = 8, .day = 20}
    };

    printf("学生1(传统初始化):\n");
    printf("  学号: %d, 姓名: %s, 成绩: %.1f, 等级: %c\n",
           s1.id, s1.name, s1.score, s1.grade);

    printf("学生2(指定初始化):\n");
    printf("  学号: %d, 姓名: %s, 成绩: %.1f, 等级: %c\n",
           s2.id, s2.name, s2.score, s2.grade);
    printf("  出生: %d-%02d-%02d\n\n",
           s2.birth.year, s2.birth.month, s2.birth.day);

    /* ======== 3. 嵌套指定初始化 ======== */
    printf("======== 3. 嵌套指定初始化 ========\n");

    struct Student s3 = {
        .id        = 1003,
        .name      = "王五",
        .grade     = 'A',
        .score     = 95.0f,
        .enrolled  = 1,
        .birth.year  = 2000,   /* 嵌套成员直接初始化 */
        .birth.month = 12,
        .birth.day   = 1
    };

    printf("嵌套指定初始化:\n");
    printf("  姓名: %s\n", s3.name);
    printf("  出生: %d-%02d-%02d\n\n",
           s3.birth.year, s3.birth.month, s3.birth.day);

    /* ======== 4. 结构体数组的指定初始化 ======== */
    printf("======== 4. 结构体数组的指定初始化 ========\n");

    /* 月份信息数组: 使用指定索引和指定成员 */
    struct MonthInfo months[] = {
        [0]  = {.id = 1,  .name = "一月",   .days = 31},
        [1]  = {.id = 2,  .name = "二月",   .days = 28},
        [2]  = {.id = 3,  .name = "三月",   .days = 31},
        [3]  = {.id = 4,  .name = "四月",   .days = 30},
        [4]  = {.id = 5,  .name = "五月",   .days = 31},
        [5]  = {.id = 6,  .name = "六月",   .days = 30},
        [6]  = {.id = 7,  .name = "七月",   .days = 31},
        [7]  = {.id = 8,  .name = "八月",   .days = 31},
        [8]  = {.id = 9,  .name = "九月",   .days = 30},
        [9]  = {.id = 10, .name = "十月",   .days = 31},
        [10] = {.id = 11, .name = "十一月", .days = 30},
        [11] = {.id = 12, .name = "十二月", .days = 31},
    };

    printf("月份信息表:\n");
    for (int i = 0; i < 12; i++) {
        printf("  %2d月: %-6s (%2d天)\n",
               months[i].id, months[i].name, months[i].days);
    }
    printf("\n");

    /* ======== 5. 指定初始化枚举索引数组 ======== */
    printf("======== 5. 以枚举为索引的数组 ========\n");

    /* 用颜色名作为数组索引,确保可读性 */
    const char *color_names[] = {
        [COLOR_RED]    = "红色",
        [COLOR_GREEN]  = "绿色",
        [COLOR_BLUE]   = "蓝色",
        [COLOR_YELLOW] = "黄色",
        [COLOR_WHITE]  = "白色",
        [COLOR_BLACK]  = "黑色",
    };
    /* 即使枚举值变化或增加新值,初始化仍然正确 */

    printf("颜色名称映射:\n");
    for (int c = COLOR_RED; c <= COLOR_BLACK; c++) {
        printf("  enum %d = %s\n", c, color_names[c]);
    }
    printf("\n");

    /* ======== 6. 指定初始化实现"默认值"模式 ======== */
    printf("======== 6. 默认配置模式 ========\n");

    struct Config default_cfg = {
        .width       = 1920,
        .height      = 1080,
        .fullscreen  = 1,
        .volume      = 0.75f,
        .theme       = "light",
        .enable_vsync = 1,
    };

    /* 用户只需覆盖需要修改的字段 */
    struct Config user_cfg = {
        .width  = 2560,
        .height = 1440,
        .theme  = "dark",
        /* 其他字段自动为0,不符合预期! */
    };

    printf("默认配置:\n");
    printf("  分辨率: %dx%d, 全屏: %d, 音量: %.2f, 主题: %s, 垂直同步: %d\n",
           default_cfg.width, default_cfg.height,
           default_cfg.fullscreen, default_cfg.volume,
           default_cfg.theme, default_cfg.enable_vsync);

    printf("\n用户配置(只指定部分字段):\n");
    printf("  分辨率: %dx%d, 主题: %s\n", user_cfg.width, user_cfg.height, user_cfg.theme);
    printf("  注意: 未指定的字段值 = %d(全屏), %.2f(音量), %d(垂直同步)\n",
           user_cfg.fullscreen, user_cfg.volume, user_cfg.enable_vsync);
    printf("  结论: 指定初始化不会继承默认值!\n\n");

    /* ======== 7. 高阶用法: 部分覆盖的实用模式 ======== */
    printf("======== 7. 实际应用: 多边形顶点初始化 ========\n");

    /* 使用指定初始化器创建多边形 */
    struct Polygon triangle = {
        .count = 3,
        .vertices = {
            [0] = {.x = 0,   .y = 0},
            [1] = {.x = 100, .y = 0},
            [2] = {.x = 50,  .y = 100}
        }
    };

    printf("三角形顶点:\n");
    for (int i = 0; i < triangle.count; i++) {
        printf("  V%d: (%d, %d)\n", i, triangle.vertices[i].x,
               triangle.vertices[i].y);
    }
    printf("\n");

    /* ======== 8. 对比: 指定初始化 vs 传统初始化 ======== */
    printf("======== 8. 指定初始化 vs 传统初始化 ========\n");

    /* 当结构体很大或字段很多时,指定初始化的优势明显 */
    struct BigStruct {
        int field1;
        int field2;
        int field3;
        int field4;
        int field5;
        int field6;
        int field7;
        int field8;
        int field9;
        int field10;
    };

    /* 传统方式: 必须记住每个位置的含义 */
    struct BigStruct a = {1, 0, 0, 0, 5, 0, 0, 0, 0, 10};

    /* 指定方式: 清晰明了,且顺序无关 */
    struct BigStruct b = {
        .field1  = 1,
        .field5  = 5,
        .field10 = 10
    };

    printf("传统:  {1, 0, 0, 0, 5, 0, 0, 0, 0, 10}\n");
    printf("指定:  {.field1=1, .field5=5, .field10=10}\n");
    printf("结果等价: field1=%d, field5=%d, field10=%d\n",
           a.field1, b.field5, b.field10);
    printf("指定初始化方式明显更可读、更易维护!\n");

    return 0;
}
