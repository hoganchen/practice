/*
 * ============================================
 * 知识点：函数参数和返回值
 * 说明：
 *   函数参数传递方式：
 *   1. 值传递（pass by value）— 传递副本，原变量不变
 *   2. 地址传递（pass by address）— 传递指针，可修改原值
 *   3. 数组传递（传递数组名指针）
 *
 *   返回值：
 *   - 可以返回基本类型、指针、结构体
 *   - 不要返回局部变量的地址
 *
 * 编译方法：
 *   gcc 02_parameters_return.c -o 02_parameters_return
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

// ========== 值传递 ==========
/*
 * 参数是值的副本。在函数内修改参数
 * 不会影响原始变量。
 */
void swap_wrong(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
    printf("  函数内部: a = %d, b = %d\n", a, b);
    // 注意：这里的修改不影响 main 中的变量
}

// ========== 地址传递（指针） ==========
/*
 * 通过指针接收变量的地址，可以修改原始变量。
 */
void swap_correct(int *a, int *b) {
    int temp = *a;  // *a 解引用，获取 a 指向的值
    *a = *b;
    *b = temp;
}

// ========== const 指针参数 ==========
/*
 * const 指针参数：函数承诺不修改指针指向的数据。
 * 用于"只读"参数，提高代码安全性。
 */
void print_array(const int *arr, int size) {
    printf("[");
    for (int i = 0; i < size; i++) {
        printf("%d", arr[i]);
        if (i < size - 1) printf(", ");
    }
    printf("]\n");
    // arr[0] = 100;  // 错误！const 参数不可修改
}

// ========== 数组作为参数 ==========
/*
 * 数组作为函数参数时，退化为指针。
 * 需要额外传递数组长度。
 */
int sum_array(const int arr[], int size) {
    int sum = 0;
    for (int i = 0; i < size; i++) {
        sum += arr[i];
    }
    return sum;
}

// ========== 返回指针 ==========
/*
 * 函数可以返回指针，但不能返回局部变量的地址！
 * 可以返回静态变量、全局变量、或动态分配内存的地址。
 */

// 正确：返回静态变量地址
int *get_counter(void) {
    static int counter = 0;  // 静态变量，生命周期贯穿整个程序
    counter++;
    return &counter;
}

// 错误演示（仅供参考，不要运行！）：
// int *bad_function(void) {
//     int local = 100;
//     return &local;  // 危险！local 在函数结束后就销毁了
// }

// ========== 返回字符串（常量字符串） ==========
const char *get_month_name(int month) {
    // 字符串字面量存储在只读数据区，安全返回
    static const char *months[] = {
        "无效月份", "一月", "二月", "三月", "四月",
        "五月", "六月", "七月", "八月",
        "九月", "十月", "十一月", "十二月"
    };

    if (month >= 1 && month <= 12) {
        return months[month];
    }
    return months[0];
}

// ========== 指针参数返回多个值 ==========
/*
 * 通过指针参数"返回"多个值
 */
void calculate_circle(double radius, double *area, double *circumference) {
    const double PI = 3.1415926535;
    *area = PI * radius * radius;
    *circumference = 2 * PI * radius;
}

// ========== 函数参数默认不检查 ==========
/*
 * C语言不会检查函数参数的类型匹配（除非有原型声明）
 */

// ========== main 函数 ==========
int main() {
    int x = 10, y = 20;

    // ========== 值传递演示 ==========
    printf("===== 值传递（无效交换） =====\n");
    printf("交换前: x = %d, y = %d\n", x, y);
    swap_wrong(x, y);
    printf("交换后: x = %d, y = %d (不变!)\n", x, y);

    // ========== 地址传递演示 ==========
    printf("\n===== 地址传递（有效交换） =====\n");
    printf("交换前: x = %d, y = %d\n", x, y);
    swap_correct(&x, &y);  // 传递地址
    printf("交换后: x = %d, y = %d\n", x, y);

    // ========== 数组作为参数 ==========
    printf("\n===== 数组参数 =====\n");
    int numbers[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int size = sizeof(numbers) / sizeof(numbers[0]);

    printf("数组内容: ");
    print_array(numbers, size);

    int total = sum_array(numbers, size);
    printf("数组总和: %d\n", total);

    // ========== 返回指针 ==========
    printf("\n===== 返回指针 =====\n");
    int *c1 = get_counter();
    int *c2 = get_counter();
    int *c3 = get_counter();
    printf("三次调用 get_counter(): %d, %d, %d\n",
           *c1, *c2, *c3);

    // ========== 返回字符串 ==========
    printf("\n===== 返回字符串 =====\n");
    for (int m = 1; m <= 12; m++) {
        printf("%2d 月: %s\n", m, get_month_name(m));
    }

    // ========== 通过指针返回多个值 ==========
    printf("\n===== 多返回值 =====\n");
    double r = 5.0;
    double area, circum;

    calculate_circle(r, &area, &circum);

    printf("半径 r = %.2f\n", r);
    printf("面积 = %.2f\n", area);
    printf("周长 = %.2f\n", circum);

    // ========== 数组修改验证 ==========
    printf("\n===== 数组作为参数可修改 =====\n");
    /*
     * 数组参数传递的是指针，所以函数内可以修改数组元素。
     */
    int data[] = {1, 2, 3, 4, 5};
    printf("原始数据: ");
    print_array(data, 5);

    // 在另一个函数中修改数组
    for (int i = 0; i < 5; i++) {
        data[i] *= 2;
    }
    printf("翻倍后: ");
    print_array(data, 5);

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. C语言默认是值传递（复制传参）
 * 2. 想修改变量 → 传递指针
 * 3. 数组作为参数退化为指针
 * 4. const 参数保护只读数据
 * 5. 不要返回局部变量的地址
 * 6. 通过指针参数实现"多返回值"
 * ============================================
 */
