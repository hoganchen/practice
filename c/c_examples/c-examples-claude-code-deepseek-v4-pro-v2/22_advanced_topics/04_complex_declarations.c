/*
 * 知识点：复杂指针声明 (Complex Pointer Declarations)
 *
 * 编译指令：gcc 04_complex_declarations.c -o 04_complex_declarations.exe -std=c11 -Wall
 * 运行指令：./04_complex_declarations.exe
 *
 * 本文件演示如何解读和编写复杂的 C 指针声明。
 *
 * 核心方法：使用"右左法则" (Right-Left Rule / Clockwise/Spiral Rule)
 *   1. 从标识符开始
 *   2. 向右看，遇到 ) 或 ] 则向左看
 *   3. 重复直到理解整个声明
 *
 * 示例解读流程：
 *   int *(*fp)(int)
 *   1. 找到 fp
 *   2. 向右 -> )，向左 -> *（fp 是指针）
 *   3. 向右 -> (int)（函数参数）
 *   4. 向左 -> *（返回 int*）
 *   结果：fp 是"指向函数的指针，该函数接收 int 参数，返回 int*"
 *
 * 声明优先级规则（类比运算符优先级）：
 *   () 和 [] 优先级高于 *
 *   声明从内向外读
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ===== 前置声明 ===== */

int add(int a, int b);
int subtract(int a, int b);
int multiply(int a, int b);

/* ===== 1. 基本指针声明 ===== */

/**
 * 演示基本指针声明
 * int *p;       —— p 是指向 int 的指针
 * int **pp;     —— pp 是指向 int* 的指针
 * int *arr[5];  —— arr 是包含 5 个 int* 的数组
 * int (*p2a)[5];—— p2a 是指向"包含 5 个 int 的数组"的指针
 */
void demo_basic_pointers(void) {
    printf("----- 1. 基本指针声明解读 -----\n");

    int value = 42;
    int *p = &value;             /* p: 指向 int 的指针 */
    int **pp = &p;               /* pp: 指向 int* 的指针 */

    printf("  int *p;        — p 是指向 int 的指针\n");
    printf("  int **pp;      — pp 是指向 int* 的指针\n");
    printf("    *p  = %d\n", *p);
    printf("    **pp = %d\n\n", **pp);

    /* 指针数组 vs 数组指针 */
    int a = 1, b = 2, c = 3;
    int *arr_of_ptrs[3] = {&a, &b, &c};  /* 指针数组 */
    int(*ptr_to_arr)[3];                  /* 数组指针 */

    int array[3] = {10, 20, 30};
    ptr_to_arr = &array;  /* 指向整个数组的指针 */

    printf("  int *arr_of_ptrs[3]; — arr_of_ptrs 是 3 个 int* 的数组\n");
    printf("    *arr_of_ptrs[0] = %d\n", *arr_of_ptrs[0]);

    printf("  int (*ptr_to_arr)[3]; — ptr_to_arr 指向 int[3] 数组的指针\n");
    printf("    (*ptr_to_arr)[1] = %d\n\n", (*ptr_to_arr)[1]);
}

/* ===== 2. 函数指针声明 ===== */

/* 简单函数：加法 */
int add(int a, int b) {
    return a + b;
}

/* 简单函数：减法 */
int subtract(int a, int b) {
    return a - b;
}

/* 简单函数：乘法 */
int multiply(int a, int b) {
    return a * b;
}

/**
 * 演示函数指针声明
 * int (*fp)(int, int); —— fp 是函数指针
 */
void demo_function_pointers(void) {
    printf("----- 2. 函数指针声明 -----\n");

    /*
     * 解读 int (*fp)(int, int):
     *   1. fp          — 标识符
     *   2. (*fp)       — 先向左：fp 是指针
     *   3. (*fp)(int,int) — 向右：指向函数
     *   4. int (*fp)(int,int) — 向左：返回 int
     *   结论：fp 是指向函数的指针，该函数接收两个 int，返回 int
     */
    int (*fp)(int, int);  /* 声明函数指针 */

    /* 将 add 函数的地址赋给 fp */
    fp = add;
    printf("  int (*fp)(int, int);\n");
    printf("  解读: fp 是指向函数的指针\n");
    printf("        接收 (int, int) 参数，返回 int\n");
    printf("  fp = add;\n");
    printf("  fp(10, 20) = %d\n\n", fp(10, 20));

    /* 使用 typedef 简化函数指针类型 */
    /*
     * typedef int (*MathFunc)(int, int);
     * 将 "int (*)(int, int)" 类型定义为 MathFunc
     */
    typedef int (*MathFunc)(int, int);

    MathFunc operations[] = {add, subtract, multiply};
    const char *names[] = {"add", "subtract", "multiply"};

    printf("  使用 typedef 简化:\n");
    printf("  typedef int (*MathFunc)(int, int);\n");
    printf("  MathFunc operations[] = {add, subtract, multiply};\n\n");

    for (int i = 0; i < 3; i++) {
        printf("  operations[%d] = %s: %d\n",
               i, names[i], operations[i](10, 5));
    }
    printf("\n");
}

/* ===== 3. 返回函数指针的函数 ===== */

/* 根据操作符返回对应的算术函数 */
int (*get_operation(char op))(int, int) {
    /*
     * 解读 int (*get_operation(char op))(int, int):
     *   1. get_operation(char op) — 函数名和参数
     *   2. (*get_operation(char op)) — 向左：返回指针
     *   3. (...)(int, int) — 向右：指向函数
     *   4. int (...)(int, int) — 向左：返回 int
     *
     * 结论：get_operation 是一个函数
     *   接收 char 参数
     *   返回指向函数的指针
    `*   该函数接收两个 int 参数
     *   返回 int
     */
    switch (op) {
        case '+': return add;
        case '-': return subtract;
        case '*': return multiply;
        default:  return NULL;
    }
}

/**
 * 演示返回函数指针的函数
 * 推荐使用 typedef 使声明更清晰
 */
void demo_returning_func_ptr(void) {
    printf("----- 3. 返回函数指针的函数 -----\n");

    /*
     * 不实用 typedef 的原始声明：
     * int (*get_operation(char op))(int, int);
     *
     * 使用 typedef 更清晰：
     * typedef int (*MathFunc)(int, int);
     * MathFunc get_operation(char op);
     */

    printf("  原始声明:\n");
    printf("  int (*get_operation(char op))(int, int);\n\n");
    printf("  解读: get_operation 是函数\n");
    printf("        接收 char 参数\n");
    printf("        返回指向函数的指针\n");
    printf("        该函数接收 (int, int) 参数，返回 int\n\n");

    typedef int (*MathFunc)(int, int);
    MathFunc func;

    func = get_operation('+');
    printf("  get_operation('+')(10, 5) = %d\n", func(10, 5));

    func = get_operation('-');
    printf("  get_operation('-')(10, 5) = %d\n", func(10, 5));

    func = get_operation('*');
    printf("  get_operation('*')(10, 5) = %d\n", func(10, 5));

    printf("\n");
}

/* ===== 4. 复杂的函数指针数组 ===== */

/**
 * 演示返回 int* 的函数
 */
int *make_int(int value) {
    int *p = (int *)malloc(sizeof(int));
    if (p != NULL) *p = value;
    return p;
}

int *duplicate_int(int value) {
    int *p = (int *)malloc(sizeof(int));
    if (p != NULL) *p = value * 2;
    return p;
}

/**
 * 演示复杂声明：函数指针数组
 */
void demo_complex_arrays(void) {
    printf("----- 4. 函数指针数组声明 -----\n");

    /*
     * int *(*arr[3])(int);
     *
     * 解读过程：
     *   1. arr[3]      — arr 是包含 3 个元素的数组
     *   2. *arr[3]     — 向左：元素是指针
     *   3. (*arr[3])(int) — 向右：指向函数，接收 int
     *   4. int *(...)(int) — 向左：返回 int*
     *
     * 结论：arr 是包含 3 个元素的数组，
     *       每个元素是函数指针，
     *       指向接收 int 参数并返回 int* 的函数
     */
    int *(*func_arr[3])(int);

    func_arr[0] = make_int;
    func_arr[1] = duplicate_int;
    func_arr[2] = make_int;  /* 重复使用 */

    printf("  int *(*func_arr[3])(int);\n");
    printf("  解读: func_arr 是包含 3 个元素的数据\n");
    printf("        每个元素是指向函数的指针\n");
    printf("        函数接收 int，返回 int*\n\n");

    for (int i = 0; i < 3; i++) {
        int *result = func_arr[i](i * 10);
        if (result != NULL) {
            printf("  func_arr[%d](%d) = %d\n", i, i * 10, *result);
            free(result);
        }
    }
    printf("\n");
}

/* ===== 5. 函数指针作为参数 ===== */

/**
 * 接收函数指针作为参数的函数
 * array: 整数数组
 * size: 数组大小
 * transform: 转换函数（接收 int，返回 int）
 */
void transform_array(int array[], int size, int (*transform)(int)) {
    /*
     * 解读 int (*transform)(int):
     *   1. transform       — 标识符
     *   2. (*transform)    — 向左：指针
     *   3. (*transform)(int) — 向右：函数，接收 int
     *   4. int (...)(int)  — 向左：返回 int
     */
    for (int i = 0; i < size; i++) {
        array[i] = transform(array[i]);
    }
}

/* 平方函数 */
int square(int x) {
    return x * x;
}

/* 绝对值函数 */
int abs_val(int x) {
    return x < 0 ? -x : x;
}

/**
 * 演示函数指针作为参数
 */
void demo_func_ptr_as_param(void) {
    printf("----- 5. 函数指针作为参数 -----\n");

    /*
     * void transform_array(int arr[], int size, int (*transform)(int));
     *
     * transform 参数解读：
     *   指向接收 int 参数并返回 int 的函数的指针
     */
    int arr[] = {-3, -2, -1, 0, 1, 2, 3};
    int size = sizeof(arr) / sizeof(arr[0]);

    printf("  原始数组: ");
    for (int i = 0; i < size; i++) printf("%d ", arr[i]);
    printf("\n");

    /* 传递 square 函数 */
    transform_array(arr, size, square);
    printf("  应用 square: ");
    for (int i = 0; i < size; i++) printf("%d ", arr[i]);
    printf("\n");

    /* 传递 abs_val 函数 */
    transform_array(arr, size, abs_val);
    printf("  应用 abs_val: ");
    for (int i = 0; i < size; i++) printf("%d ", arr[i]);
    printf("\n\n");
}

/* ===== 6. 声明的解读技巧总结 ===== */

void demo_reading_technique(void) {
    printf("----- 6. 右左法则解读技巧 -----\n");

    const char *examples[] = {
        "int *p;                     — p 是 int 指针",
        "int *arr[5];                — arr 是 5 个 int* 的数组",
        "int (*ptr)[5];              — ptr 是指向 int[5] 的指针",
        "int *func(int);             — func 是函数，接收 int，返回 int*",
        "int (*fp)(int);             — fp 是指向函数的指针，接收 int，返回 int",
        "int *(*fp)(int);            — fp 是指向函数的指针，接收 int，返回 int*",
        "void (*fp)(int, int);       — fp 是指向函数的指针，接收 (int,int)，返回 void",
        "int (*(*fp)(int))(double);  — fp 是指向函数的指针，接收 int，返回指向函数的指针，"
        "该函数接收 double 返回 int",
    };

    int count = sizeof(examples) / sizeof(examples[0]);

    for (int i = 0; i < count; i++) {
        printf("  %s\n", examples[i]);
    }

    printf("\n");

    printf("  右左法则步骤：\n");
    printf("  1) 找标识符\n");
    printf("  2) 向右看（[], ()）\n");
    printf("  3) 向左看（*, ()）\n");
    printf("  4) 向外层重复\n");
    printf("  口诀：先右后左，由内向外\n\n");

    printf("  练习：int *(*(*fp)(int))[10];\n");
    printf("  分解：fp 是指针 -> 指向函数(参数int) -> \n");
    printf("        返回指针 -> 指向数组[10] -> 元素类型 int*\n");
}

/* ===== 主函数 ===== */

int main() {
    printf("============================================\n");
    printf("  复杂指针声明解读演示\n");
    printf("============================================\n\n");

    demo_basic_pointers();
    demo_function_pointers();
    demo_returning_func_ptr();
    demo_complex_arrays();
    demo_func_ptr_as_param();
    demo_reading_technique();

    printf("============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
