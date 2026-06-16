/*
 * ============================================
 * 知识点：结构体基础
 * 说明：
 *   结构体是用户自定义的数据类型，可以
 *   将不同类型的变量组合在一起。
 *
 *   定义语法：
 *   struct 标签名 {
 *       类型1 成员1;
 *       类型2 成员2;
 *       ...
 *   };
 *
 *   结构体的大小可能不等于成员大小之和
 *   （内存对齐 padding）
 *
 * 编译方法：
 *   gcc 01_struct_basics.c -o 01_struct_basics
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <string.h>
#include <stddef.h>  // offsetof 宏

// ========== 结构体定义 ==========

// 定义学生结构体
struct Student {
    int id;                // 学号
    char name[50];         // 姓名
    float score;           // 成绩
    // 注意：结构体定义的末尾必须有分号
};

// 定义点结构体
struct Point {
    int x;
    int y;
};

// 定义矩形结构体（嵌套使用 Point）
struct Rectangle {
    struct Point top_left;      // 左上角
    struct Point bottom_right;  // 右下角
};

// ========== typedef 简化类型名 ==========
// 使用 typedef 可以不写 struct 关键字
typedef struct {
    int year;
    int month;
    int day;
} Date;  // 现在 Date 就是一个类型名

int main() {
    // ========== 结构体变量声明和初始化 ==========
    printf("===== 结构体声明和初始化 =====\n");

    // 方式1：声明时初始化
    struct Student s1 = {1001, "张三", 85.5f};
    printf("学生 s1: ID=%d, 姓名=%s, 成绩=%.1f\n",
           s1.id, s1.name, s1.score);

    // 方式2：指定初始化（C99）
    struct Student s2 = {.id = 1002, .name = "李四", .score = 92.0f};
    printf("学生 s2: ID=%d, 姓名=%s, 成绩=%.1f\n",
           s2.id, s2.name, s2.score);

    // 方式3：部分初始化（未指定成员自动为 0）
    struct Student s3 = {1003};  // name 为空，score 为 0
    printf("学生 s3: ID=%d, 姓名=%s, 成绩=%.1f\n",
           s3.id, s3.name, s3.score);

    // 方式4：先声明再逐个赋值
    struct Student s4;
    s4.id = 1004;
    // s4.name = "王五";  // 错误！不能直接给数组赋值
    strcpy(s4.name, "王五");  // 要用 strcpy
    s4.score = 78.5f;
    printf("学生 s4: ID=%d, 姓名=%s, 成绩=%.1f\n",
           s4.id, s4.name, s4.score);

    // ========== 访问和修改成员 ==========
    printf("\n===== 访问和修改成员 =====\n");

    s1.score = 90.0f;  // 修改成绩
    printf("修改后 s1 成绩: %.1f\n", s1.score);

    // ========== 结构体赋值 ==========
    printf("\n===== 结构体赋值 =====\n");

    struct Student s5 = s1;  // 结构体可以直接赋值（逐个成员复制）
    printf("s5 (从 s1 复制): ID=%d, 姓名=%s, 成绩=%.1f\n",
           s5.id, s5.name, s5.score);

    // 修改 s5 不会影响 s1
    s5.id = 2000;
    printf("修改 s5.id 后:\n");
    printf("  s1.id = %d (不变)\n", s1.id);
    printf("  s5.id = %d (已修改)\n", s5.id);

    // ========== 结构体大小 ==========
    printf("\n===== 结构体大小（内存对齐） =====\n");

    /*
     * 结构体的大小可能大于成员大小之和。
     * 这是因为编译器会在成员之间或末尾
     * 添加填充字节（padding）以保证对齐。
     */
    printf("sizeof(struct Student) = %zu\n",
           sizeof(struct Student));
    printf("  成员大小之和: %zu + %zu + %zu = %zu\n",
           sizeof(int), sizeof(char[50]), sizeof(float),
           sizeof(int) + sizeof(char[50]) + sizeof(float));

    // 演示不同的成员顺序导致不同大小
    struct Packed1 {
        char c;    // 1 字节
        int i;     // 4 字节
        short s;   // 2 字节
    };

    struct Packed2 {
        int i;     // 4 字节
        short s;   // 2 字节
        char c;    // 1 字节
    };

    printf("\n不同成员顺序的大小:\n");
    printf("struct Packed1: %zu 字节\n", sizeof(struct Packed1));
    printf("struct Packed2: %zu 字节\n", sizeof(struct Packed2));
    printf("合理安排成员顺序可以节省空间\n");

    // ========== typedef 结构体 ==========
    printf("\n===== typedef 结构体 =====\n");

    Date today = {2024, 1, 15};
    printf("日期: %d-%02d-%02d\n", today.year, today.month, today.day);

    // ========== 结构体数组 ==========
    printf("\n===== 结构体数组 =====\n");

    struct Student class[] = {
        {2001, "小明", 88.0f},
        {2002, "小红", 95.5f},
        {2003, "小刚", 72.0f}
    };

    int count = sizeof(class) / sizeof(class[0]);

    printf("班级学生列表:\n");
    for (int i = 0; i < count; i++) {
        printf("  %d. %s (ID: %d) 成绩: %.1f\n",
               i + 1, class[i].name, class[i].id, class[i].score);
    }

    // ========== 嵌套结构体 ==========
    printf("\n===== 嵌套结构体 =====\n");

    struct Rectangle rect = {
        {10, 20},   // top_left
        {50, 80}    // bottom_right
    };

    int width = rect.bottom_right.x - rect.top_left.x;
    int height = rect.bottom_right.y - rect.top_left.y;
    int area = width * height;

    printf("矩形: (%d,%d)-(%d,%d)\n",
           rect.top_left.x, rect.top_left.y,
           rect.bottom_right.x, rect.bottom_right.y);
    printf("宽度: %d, 高度: %d, 面积: %d\n",
           width, height, area);

    // ========== 结构体成员的偏移量 ==========
    printf("\n===== 成员偏移量 =====\n");

    // 使用 offsetof 宏获取成员在结构体中的偏移
    printf("Student.id 的偏移: %zu\n", offsetof(struct Student, id));
    printf("Student.name 的偏移: %zu\n",
           offsetof(struct Student, name));
    printf("Student.score 的偏移: %zu\n",
           offsetof(struct Student, score));

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 结构体将不同类型数据组合在一起
 * 2. 用 . 访问成员，用 strcpy 给字符串成员赋值
 * 3. 结构体可以整体赋值（成员逐个复制）
 * 4. 结构体有内存对齐，大小可能大于成员之和
 * 5. 合理安排成员顺序可节省空间
 * 6. typedef 简化结构体类型名
 * ============================================
 */
