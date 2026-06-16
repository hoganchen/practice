/*
 * ============================================
 * 知识点：函数指针
 * 说明：
 *   函数指针是指向函数的指针，可以像普通
 *   函数一样调用。用于回调、策略模式、动态
 *   分发等场景。
 *
 * 声明语法：
 *   返回类型 (*指针名)(参数列表);
 *   例如：int (*op)(int, int);
 *
 * 编译方法：
 *   gcc 01_function_pointers.c -o 01_function_pointers
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>
#include <math.h>

// ========== 基本函数 ==========
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int mul(int a, int b) { return a * b; }
int divide_wrapper(int a, int b) {
    return (b != 0) ? a / b : 0;
}

// ========== 函数指针基础 ==========
void basic_example(void) {
    printf("===== 函数指针基础 =====\n");

    // 声明函数指针：返回 int，接收两个 int 参数
    int (*op)(int, int);

    // 指向 add 函数
    op = add;          // 函数名就是地址
    // op = &add;      // 也可以取地址（等价）

    // 通过函数指针调用
    int result = op(10, 5);
    printf("add(10, 5) = %d (通过函数指针)\n", result);

    // 重新指向其他函数
    op = sub;
    printf("sub(10, 5) = %d\n", op(10, 5));

    op = mul;
    printf("mul(10, 5) = %d\n", op(10, 5));

    // 打印函数指针的值
    printf("函数指针地址: %p\n", (void*)op);
}

// ========== 函数指针作为参数（回调） ==========
/*
 * 接收一个函数指针作为参数。
 * 这是函数指针最常用的场景。
 */
int compute(int a, int b, int (*operation)(int, int)) {
    printf("  计算 %d op %d = ", a, b);
    int result = operation(a, b);
    printf("%d\n", result);
    return result;
}

// ========== 函数指针数组（跳转表） ==========
void jump_table_example(void) {
    printf("\n===== 函数指针数组（跳转表） =====\n");

    // 定义函数指针数组
    int (*operations[])(int, int) = {add, sub, mul, divide_wrapper};
    const char *names[] = {"加法", "减法", "乘法", "除法"};

    int a = 20, b = 5;

    // 遍历执行所有操作
    for (int i = 0; i < 4; i++) {
        printf("%s: %d %d = %d\n",
               names[i], a, b, operations[i](a, b));
    }
}

// ========== 返回函数指针 ==========
/*
 * 根据操作符返回对应的函数指针
 */
typedef int (*MathOp)(int, int);

MathOp get_operation(char op) {
    switch (op) {
        case '+': return add;
        case '-': return sub;
        case '*': return mul;
        case '/': return divide_wrapper;
        default:  return NULL;
    }
}

// ========== 比较函数（用于 qsort） ==========
int compare_int_asc(const void *a, const void *b) {
    return *(int*)a - *(int*)b;  // 升序
}

int compare_int_desc(const void *a, const void *b) {
    return *(int*)b - *(int*)a;  // 降序
}

// ========== 回调函数 ==========
// 遍历数组并对每个元素应用回调
void for_each(int *arr, int size, void (*callback)(int)) {
    for (int i = 0; i < size; i++) {
        callback(arr[i]);  // 每个元素调用回调
    }
}

void print_element(int x) {
    printf("%d ", x);
}

void double_element(int *x) {
    *x *= 2;
}

// 另一种：回调可以修改元素
void transform(int *arr, int size, int (*func)(int)) {
    for (int i = 0; i < size; i++) {
        arr[i] = func(arr[i]);
    }
}

int square_func(int x) { return x * x; }
int negate_func(int x) { return -x; }

// ========== 带状态的回调（通过 context 参数） ==========
void process(int *arr, int size,
             int (*func)(int, void*), void *context) {
    for (int i = 0; i < size; i++) {
        arr[i] = func(arr[i], context);
    }
}

int add_value(int x, void *context) {
    return x + *(int*)context;
}

// ========== main ==========
int main() {
    basic_example();

    // ========== 函数指针作为参数 ==========
    printf("\n===== 函数指针作为参数（回调） =====\n");
    compute(10, 5, add);
    compute(10, 5, mul);

    // ========== 跳转表 ==========
    jump_table_example();

    // ========== 返回函数指针 ==========
    printf("\n===== 返回函数指针 =====\n");

    char ops[] = {'+', '-', '*', '/'};
    int a = 30, b = 6;

    for (int i = 0; i < 4; i++) {
        MathOp op = get_operation(ops[i]);
        if (op != NULL) {
            printf("%d %c %d = %d\n", a, ops[i], b, op(a, b));
        }
    }

    // ========== qsort 与比较函数 ==========
    printf("\n===== qsort 与函数指针 =====\n");

    int numbers[] = {7, 2, 9, 1, 5, 3, 8, 4, 6};
    int n = sizeof(numbers) / sizeof(numbers[0]);

    printf("原始: ");
    for_each(numbers, n, print_element);
    printf("\n");

    // 升序排序（传入比较函数指针）
    qsort(numbers, n, sizeof(int), compare_int_asc);
    printf("升序: ");
    for_each(numbers, n, print_element);
    printf("\n");

    // 降序排序
    qsort(numbers, n, sizeof(int), compare_int_desc);
    printf("降序: ");
    for_each(numbers, n, print_element);
    printf("\n");

    // ========== transform 回调 ==========
    printf("\n===== transform 回调 =====\n");

    int data[] = {1, 2, 3, 4, 5};
    int size = sizeof(data) / sizeof(data[0]);

    printf("原始: ");
    for_each(data, size, print_element);

    transform(data, size, square_func);
    printf("\n平方: ");
    for_each(data, size, print_element);

    transform(data, size, negate_func);
    printf("\n取反: ");
    for_each(data, size, print_element);
    printf("\n");

    // ========== 带上下文的回调 ==========
    printf("\n===== 带上下文回调 =====\n");

    int vals[] = {1, 2, 3, 4, 5};
    int add_val = 10;

    process(vals, 5, add_value, &add_val);
    printf("各加 %d: ", add_val);
    for_each(vals, 5, print_element);
    printf("\n");

    // ========== typedef 简化 ==========
    printf("\n===== typedef 简化函数指针 =====\n");

    printf("使用 typedef 可以简化:\n");
    printf("  typedef int (*MathOp)(int, int);\n");
    printf("  MathOp op = add;  // 不需写完整类型\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 函数指针存储函数的地址
 * 2. 函数名本身就是地址（&func 也可）
 * 3. 函数指针作为参数实现回调
 * 4. 函数指针数组实现跳转表
 * 5. 函数指针可作为返回值
 * 6. qsort 等库函数使用函数指针参数
 * 7. typedef 可以简化函数指针声明
 * ============================================
 */
