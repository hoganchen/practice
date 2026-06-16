/**
 * ============================================================================
 * 知识要点: 复合字面量 (Compound Literals) — C99 引入
 * ============================================================================
 *
 * 编译指令: gcc 06_compound_literals.c -o 06_compound_literals.exe -std=c11 -Wall
 * 运行指令: ./06_compound_literals.exe
 *
 * 知识点概述:
 *   复合字面量的语法: (type){initializer}
 *   它创建一个匿名的临时对象，可以直接使用，无需先声明变量。
 *
 * 主要用途:
 *   - 作为函数参数传递结构体或数组
 *   - 作为函数的返回值
 *   - 初始化数组或结构体
 *   - 创建临时数组传递给函数
 *
 * 生命周期规则:
 *   - 在函数内部（块作用域）创建时，生命周期为当前块（自动存储期）
 *   - 在文件作用域（全局）创建时，生命周期为整个程序（静态存储期）
 * ============================================================================
 */

#include "../common/charset.h"
#include <stdio.h>   /* printf */
#include <string.h>  /* memset, strcpy */

/* ============================================================================
 * 示例用结构体定义
 * ============================================================================
 */

/* 点坐标 */
typedef struct {
    int x;
    int y;
} Point;

/* 矩形（由两个对角点定义） */
typedef struct {
    Point top_left;
    Point bottom_right;
} Rectangle;

/* 复数（极坐标形式） */
typedef struct {
    double magnitude;  /* 模 */
    double angle;      /* 角度（弧度） */
} ComplexPolar;

/* 简单学生记录 */
typedef struct {
    int id;
    char name[50];
    double score;
} Student;

/* ============================================================================
 * 示例 1: 用复合字面量作为函数参数
 *
 * 传统做法需要先声明一个变量再传参:
 *   Point p = {10, 20};
 *   print_point(p);
 *
 * 复合字面量可以直接在调用处创建:
 *   print_point((Point){10, 20});
 * ============================================================================
 */

void print_point(Point p)
{
    printf("点坐标: (%d, %d)\n", p.x, p.y);
}

void demonstrate_function_arguments(void)
{
    printf("\n====== 示例 1: 复合字面量作为函数参数 ======\n");

    /* 传统方式: 先声明临时变量，再传递 */
    Point p1 = {10, 20};
    print_point(p1);

    /* 复合字面量方式: 直接在调用处创建匿名对象 */
    print_point((Point){30, 40});
    print_point((Point){-5, 15});
    print_point((Point){100, 200});
}

/* ============================================================================
 * 示例 2: 用复合字面量初始化结构体字段
 *
 * 可以在结构体初始化器中嵌套使用复合字面量
 * ============================================================================
 */

void demonstrate_nested_initialization(void)
{
    printf("\n====== 示例 2: 嵌套结构体初始化 ======\n");

    /* 传统方式: 需要分别声明嵌套的结构体 */
    Point tl = {0, 0};
    Point br = {100, 200};
    Rectangle r1 = {tl, br};
    printf("矩形 r1: 左上=(%d,%d), 右下=(%d,%d)\n",
           r1.top_left.x, r1.top_left.y,
           r1.bottom_right.x, r1.bottom_right.y);

    /* 复合字面量方式: 直接在初始化器中使用 */
    Rectangle r2 = {
        (Point){50, 50},     /* 匿名 Point 对象 */
        (Point){200, 300}    /* 匿名 Point 对象 */
    };
    printf("矩形 r2: 左上=(%d,%d), 右下=(%d,%d)\n",
           r2.top_left.x, r2.top_left.y,
           r2.bottom_right.x, r2.bottom_right.y);

    /* 指定初始化器 + 复合字面量混合使用 */
    Rectangle r3 = {
        .bottom_right = (Point){800, 600},
        .top_left     = (Point){100, 100}
    };
    printf("矩形 r3: 左上=(%d,%d), 右下=(%d,%d)\n",
           r3.top_left.x, r3.top_left.y,
           r3.bottom_right.x, r3.bottom_right.y);
}

/* ============================================================================
 * 示例 3: 复合字面量用在函数返回值中
 *
 * 函数可以直接返回一个复合字面量创建的结构体，
 * 避免了外部声明临时变量
 * ============================================================================
 */

/* 使用复合字面量直接返回 Point */
Point make_point(int x, int y)
{
    return (Point){x, y};  /* 复合字面量作为返回值 */
}

/* 使用复合字面量计算两点之间的中点 */
Point midpoint(Point a, Point b)
{
    return (Point){
        .x = (a.x + b.x) / 2,
        .y = (a.y + b.y) / 2
    };
}

void demonstrate_return_values(void)
{
    printf("\n====== 示例 3: 复合字面量作为返回值 ======\n");

    Point p1 = make_point(10, 20);
    Point p2 = make_point(30, 40);
    printf("p1 = "); print_point(p1);
    printf("p2 = "); print_point(p2);

    Point mid = midpoint(p1, p2);
    printf("中点 = "); print_point(mid);

    /* 直接使用返回的复合字面量作为另一个函数的参数 */
    printf("两点之和的中点: ");
    print_point(midpoint((Point){5, 5}, (Point){15, 25}));
}

/* ============================================================================
 * 示例 4: 复合字面量与数组
 *
 * 复合字面量可以创建匿名数组，并用于:
 *   1. 传递数组给函数
 *   2. 初始化数组指针
 *   3. 获取数组首地址
 * ============================================================================
 */

/* 计算整型数组的和 */
int sum_array(const int arr[], size_t count)
{
    int total = 0;
    for (size_t i = 0; i < count; i++) {
        total += arr[i];
    }
    return total;
}

/* 打印浮点数数组 */
void print_double_array(const double arr[], size_t count)
{
    printf("[");
    for (size_t i = 0; i < count; i++) {
        printf("%.1f", arr[i]);
        if (i < count - 1) {
            printf(", ");
        }
    }
    printf("]\n");
}

void demonstrate_arrays(void)
{
    printf("\n====== 示例 4: 复合字面量与数组 ======\n");

    /* 创建匿名 int 数组直接传给函数 */
    int sum = sum_array((int[]){1, 2, 3, 4, 5}, 5);
    printf("(int[]){1, 2, 3, 4, 5} 的和 = %d\n", sum);

    /* 匿名 double 数组 */
    print_double_array((double[]){3.14, 2.718, 1.618}, 3);

    /* 匿名 2D 数组 */
    int matrix[2][3] = {
        {1, 2, 3},
        {4, 5, 6}
    };
    printf("矩阵定义使用复合字面量风格:\n");
    for (int i = 0; i < 2; i++) {
        printf("  行 %d: ", i);
        for (int j = 0; j < 3; j++) {
            printf("%d ", matrix[i][j]);
        }
        printf("\n");
    }

    /* 复合字面量数组取地址和指针 */
    int *ptr = (int[]){10, 20, 30, 40};
    printf("匿名数组指针: ");
    for (int i = 0; i < 4; i++) {
        printf("%d ", ptr[i]);
    }
    printf("\n");
}

/* ============================================================================
 * 示例 5: 复合字面量的生命周期演示
 *
 * 块作用域的复合字面量在块结束时销毁
 * 文件作用域的复合字面量在整个程序运行期间存在
 *
 * 注意: 复合字面量不是常量，可以修改（除非用 const 限定）
 * ============================================================================
 */

/* 文件作用域的复合字面量 — 整个程序生命周期 */
const int *global_array = (const int[]){100, 200, 300, 400, 500};

void demonstrate_lifetime(void)
{
    printf("\n====== 示例 5: 生命周期 ======\n");

    /* 文件作用域: 全局可用 */
    printf("文件作用域匿名数组: ");
    for (int i = 0; i < 5; i++) {
        printf("%d ", global_array[i]);
    }
    printf("\n");

    /* 块作用域: 复合字面量的生命周期从创建点开始到块结束 */
    {
        /* 这些匿名对象只在当前块内有效 */
        Point temp = (Point){-1, -1};
        printf("块内复合字面量: ");
        print_point(temp);
    }
    /* 离开块后，上面的匿名 Point 对象已被销毁 */

    /* 复合字面量可修改（除非加 const）*/
    int *mutable = (int[]){1, 2, 3};
    mutable[0] = 99;  /* 可以修改 */
    printf("可修改的复合字面量数组: [%d, %d, %d]\n",
           mutable[0], mutable[1], mutable[2]);
}

/* ============================================================================
 * 示例 6: 复合字面量的实用场景
 *
 * 场景 1: 构建临时配置结构体
 * 场景 2: 批量调用函数
 * 场景 3: 构建复杂嵌套结构体
 * ============================================================================
 */

/* 通用绘图函数：画线 */
void draw_line(Point start, Point end, const char *color)
{
    printf("画线: (%d,%d) -> (%d,%d), 颜色=%s\n",
           start.x, start.y, end.x, end.y, color);
}

/* 通用绘图函数：画矩形 */
void draw_rect(Rectangle r, const char *color)
{
    printf("画矩形: (%d,%d)-(%d,%d), 颜色=%s\n",
           r.top_left.x, r.top_left.y,
           r.bottom_right.x, r.bottom_right.y,
           color);
}

/* 批量初始化学生数组 */
void init_students(Student students[], size_t count)
{
    /* 使用复合字面量批量初始化 */
    Student default_student = (Student){.id = 0, .score = 0.0, .name = ""};
    for (size_t i = 0; i < count; i++) {
        students[i] = default_student;
    }
}

void demonstrate_practical_usage(void)
{
    printf("\n====== 示例 6: 实用场景 ======\n");

    /* 场景 1: 直接传递结构体给绘图函数 */
    draw_line((Point){0, 0}, (Point){100, 100}, "red");
    draw_line((Point){50, 50}, (Point){200, 150}, "blue");

    /* 场景 2: 构建矩形并传入 */
    draw_rect(
        (Rectangle){
            (Point){10, 10},      /* top_left */
            (Point){300, 200}     /* bottom_right */
        },
        "green"
    );

    /* 场景 3: 使用 for 循环配合复合字面量 */
    printf("\n绘制多条线:\n");
    for (int i = 0; i < 5; i++) {
        draw_line(
            (Point){0, 0},
            (Point){i * 20, i * 30},
            "black"
        );
    }

    /* 场景 4: 初始化数组使用复合字面量 */
    Student students[3];
    init_students(students, 3);
    printf("初始化后的学生数组长度: %zu\n", sizeof(students) / sizeof(students[0]));
}

/* ============================================================================
 * 补充: 复合字面量在 C++ 中不可用
 *
 * 复合字面量是 C99 的特性，C++ 不支持。
 * 如果在 C++ 编译器中尝试使用，会编译错误。
 *
 * 替代方案:
 *   在 C++ 中，可以使用构造函数或初始化列表来达到类似效果。
 * ============================================================================
 */

/* ============================================================================
 * 主函数
 * ============================================================================
 */
int main(void)
{
    printf("============================================\n");
    printf("  复合字面量 (Compound Literals) 示例\n");
    printf("============================================\n");

    demonstrate_function_arguments();
    demonstrate_nested_initialization();
    demonstrate_return_values();
    demonstrate_arrays();
    demonstrate_lifetime();
    demonstrate_practical_usage();

    printf("\n============================================\n");
    printf("  程序运行完毕\n");
    printf("============================================\n");

    return 0;
}

/* ============================================================================
 * 最佳实践总结:
 *
 * 1. 复合字面量适用的场景:
 *    - 函数参数临时构建结构体/数组，不必声明临时变量
 *    - 嵌套结构体初始化时直接构建内部结构体
 *    - 返回结构体值的函数可以直接 return (Type){...}
 *    - 测试代码中快速创建测试数据
 *
 * 2. 注意事项:
 *    - 块作用域的复合字面量在块结束后失效，不要保存其指针长期使用
 *    - 默认是可修改的，如果需要不可修改，加 const (const int[]){1,2,3}
 *    - 复合字面量不是常量表达式（文件作用域除外，是静态存储期）
 *    - sizeof 作用于复合字面量可以得到正确的大小
 *    - 在 C++ 中不可用，如果代码需要兼容 C++，避免使用
 * ============================================================================
 */
