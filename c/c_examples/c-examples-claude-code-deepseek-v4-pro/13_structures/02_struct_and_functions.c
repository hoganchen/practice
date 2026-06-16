/*
 * ============================================
 * 知识点：结构体与函数
 * 说明：
 *   结构体可以作为函数参数传递，但需要注意：
 *   1. 值传递：传递整个结构体的副本，开销大
 *   2. 指针传递：只传递地址，效率高
 *   3. 返回结构体：可以返回结构体或结构体指针
 *
 *   最佳实践：
 *   - 大结构体用指针传递（加 const 保护）
 *   - 小结构体（几个成员）可以值传递
 *
 * 编译方法：
 *   gcc 02_struct_and_functions.c -o 02_struct_and_functions
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>  // malloc, free
#include <string.h>
#include <math.h>

typedef struct {
    double x;
    double y;
} Point2D;

typedef struct {
    int id;
    char name[50];
    float scores[3];  // 三门课成绩
    float average;
} Student;

// ========== 值传递结构体 ==========
/*
 * 传递整个结构体副本
 * 优点：不影响原结构体
 * 缺点：大结构体复制开销大
 */
Point2D add_points(Point2D p1, Point2D p2) {
    Point2D result;
    result.x = p1.x + p2.x;
    result.y = p1.y + p2.y;
    return result;  // 返回结构体
}

void print_point(Point2D p) {
    printf("(%.1f, %.1f)", p.x, p.y);
}

// ========== 指针传递结构体 ==========
/*
 * 传递地址，效率高
 */
void scale_point(Point2D *p, double factor) {
    p->x *= factor;  // -> 等价于 (*p).x
    p->y *= factor;
}

// ========== const 指针参数 ==========
/*
 * 保护结构体不被修改
 */
void print_student(const Student *s) {
    printf("Student{id=%d, name=%s, avg=%.1f}\n",
           s->id, s->name, s->average);
    // s->id = 100;  // 错误！const 指针不能修改
}

// ========== 返回结构体 ==========
Student create_student(int id, const char *name) {
    Student s;
    s.id = id;
    strcpy(s.name, name);

    // 初始化成绩
    for (int i = 0; i < 3; i++) {
        s.scores[i] = 0.0f;
    }
    s.average = 0.0f;

    return s;  // 返回结构体（复制）
}

// ========== 返回结构体指针 ==========
// 注意：不能返回局部结构体的地址！
// 正确做法：返回静态结构体或动态分配

Student *create_student_dynamic(int id, const char *name) {
    Student *s = (Student*)malloc(sizeof(Student));
    if (s != NULL) {
        s->id = id;
        strcpy(s->name, name);
        for (int i = 0; i < 3; i++) {
            s->scores[i] = 0.0f;
        }
        s->average = 0.0f;
    }
    return s;  // 返回动态分配的结构体
}

// ========== 计算平均分（通过指针修改） ==========
void calculate_average(Student *s) {
    float sum = 0;
    for (int i = 0; i < 3; i++) {
        sum += s->scores[i];
    }
    s->average = sum / 3.0f;
}

// ========== 查找学生（返回指针） ==========
Student *find_by_id(Student students[], int count, int target_id) {
    for (int i = 0; i < count; i++) {
        if (students[i].id == target_id) {
            return &students[i];  // 返回数组中元素的地址
        }
    }
    return NULL;  // 没找到
}

// ========== main ==========
int main() {
    // ========== 值传递 ==========
    printf("===== 值传递结构体 =====\n");

    Point2D p1 = {3.0, 4.0};
    Point2D p2 = {5.0, 6.0};

    printf("p1 = ");
    print_point(p1);
    printf("\n");

    Point2D p3 = add_points(p1, p2);
    printf("p1 + p2 = ");
    print_point(p3);
    printf("\n\n");

    // ========== 指针传递 ==========
    printf("===== 指针传递结构体 =====\n");

    Point2D pt = {2.0, 3.0};
    printf("原始: ");
    print_point(pt);
    printf("\n");

    scale_point(&pt, 3.0);
    printf("缩放 3 倍: ");
    print_point(pt);
    printf("\n\n");

    // ========== 创建和计算 ==========
    printf("===== 学生管理 =====\n");

    Student s1 = create_student(1001, "张三");
    s1.scores[0] = 85.0f;
    s1.scores[1] = 90.0f;
    s1.scores[2] = 78.0f;
    calculate_average(&s1);

    print_student(&s1);

    // ========== 动态分配结构体 ==========
    printf("\n===== 动态分配结构体 =====\n");

    Student *s2 = create_student_dynamic(1002, "李四");
    if (s2 != NULL) {
        s2->scores[0] = 92.0f;
        s2->scores[1] = 88.0f;
        s2->scores[2] = 95.0f;
        calculate_average(s2);
        print_student(s2);
        free(s2);  // 记得释放！
    }

    // ========== 结构体数组查找 ==========
    printf("\n===== 结构体数组 =====\n");

    Student class[3];
    for (int i = 0; i < 3; i++) {
        char name[50];
        sprintf(name, "学生%d", i + 1);
        class[i] = create_student(2000 + i, name);
        class[i].scores[0] = 80.0f + i * 5;
        class[i].scores[1] = 85.0f + i * 3;
        class[i].scores[2] = 90.0f - i * 2;
        calculate_average(&class[i]);
    }

    printf("查找 ID=2001 的学生:\n");
    Student *found = find_by_id(class, 3, 2001);
    if (found != NULL) {
        print_student(found);
    }

    // ========== 值传递 vs 指针传递 ==========
    printf("\n===== 传递方式对比 =====\n");

    printf("值传递:\n");
    printf("  优点：不影响原数据，行为可预测\n");
    printf("  缺点：复制整个结构体，大结构体效率低\n");
    printf("  适用：小结构体（< 64 字节）\n");

    printf("\n指针传递:\n");
    printf("  优点：只传地址（8字节），效率高\n");
    printf("  缺点：可能修改原数据，需注意 const\n");
    printf("  适用：大结构体或需要修改时\n");

    // ========== 结构体作为函数参数的性能演示 ==========
    printf("\n===== 性能对比概念 =====\n");

    printf("大结构体 (1024 字节) 传递方式:\n");
    printf("值传递: 复制 1024 字节\n");
    printf("指针传递: 复制 8 字节（仅地址）\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 小结构体适合值传递，大结构体用指针
 * 2. 指针参数用 const 保护只读数据
 * 3. -> 运算符访问指针指向的结构体成员
 * 4. 不能返回局部结构体的地址
 * 5. 动态分配的结构体需要手动释放
 * 6. 结构体数组可被函数遍历和修改
 * ============================================
 */
