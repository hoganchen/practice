/*
 * 知识点：多文件项目中的源文件实现 (Source File Implementation)
 *
 * 本文件实现 helper.h 中声明的所有函数。
 * 编译方式（生成目标文件）：
 *   gcc -c helper.c -o helper.o -std=c11 -Wall
 *
 * 设计原则：
 *   - 在 .c 文件中 #include 对应的 .h 文件，确保声明和定义一致
 *   - 每个函数只做一件事（单一职责原则）
 *   - 添加边界检查，防止缓冲区溢出
 */

#include "helper.h"  /* 包含头文件，确保声明和定义匹配 */

#include "../common/charset.h"
#include <time.h>    /* 用于随机数种子初始化 */

/*
 * 随机数初始化标志（静态全局变量）
 * static 限定作用域为当前文件，对外部文件不可见
 * 这实现了信息隐藏（封装）
 */
static int s_random_seeded = 0;

/* ===== 数学运算函数 ===== */

int add(int a, int b) {
    return a + b;
}

int subtract(int a, int b) {
    return a - b;
}

int multiply(int a, int b) {
    return a * b;
}

double divide(int a, int b) {
    /* 检查除零错误 */
    if (b == 0) {
        fprintf(stderr, "错误：除数不能为 0！\n");
        return 0.0;
    }
    return (double)a / b;
}

/* ===== 递归函数 ===== */

long long factorial(int n) {
    /* 边界检查：负数没有阶乘 */
    if (n < 0) {
        fprintf(stderr, "错误：负数没有阶乘！\n");
        return 0;
    }

    /* 基准情况：0! = 1 */
    if (n <= 1) {
        return 1;
    }

    /* 递归情况：n! = n * (n-1)! */
    return n * factorial(n - 1);
}

/* ===== 素数判断 ===== */

int is_prime(int n) {
    /* 小于 2 的数不是素数 */
    if (n < 2) {
        return 0;
    }

    /* 2 是最小的素数 */
    if (n == 2) {
        return 1;
    }

    /* 偶数不是素数（除了 2） */
    if (n % 2 == 0) {
        return 0;
    }

    /* 检查奇数因子，只需检查到 sqrt(n) */
    for (int i = 3; i * i <= n; i += 2) {
        if (n % i == 0) {
            return 0;  /* 找到因子，不是素数 */
        }
    }

    return 1;  /* 未找到因子，是素数 */
}

/* ===== 字符串处理函数 ===== */

void to_upper(char *str) {
    if (str == NULL) {
        return;  /* 空指针检查 */
    }

    /* 遍历字符串中的每个字符 */
    for (int i = 0; str[i] != '\0'; i++) {
        /* toupper 来自 <ctype.h>，将小写字母转换为大写 */
        str[i] = (char)toupper((unsigned char)str[i]);
    }
}

int word_count(const char *str) {
    if (str == NULL || *str == '\0') {
        return 0;  /* 空字符串或空指针 */
    }

    int count = 0;
    int in_word = 0;  /* 标记是否在单词内 */

    /* 遍历字符串，统计单词（由空格分隔的连续字符） */
    while (*str != '\0') {
        if (isspace((unsigned char)*str)) {
            in_word = 0;  /* 遇到空白字符，标记不在单词内 */
        } else if (!in_word) {
            in_word = 1;  /* 遇到非空白字符且之前不在单词内，新单词开始 */
            count++;
        }
        str++;
    }

    return count;
}

/* ===== 随机数工具 ===== */

int random_range(int min, int max) {
    /* 首次调用时初始化随机数种子 */
    if (!s_random_seeded) {
        srand((unsigned int)time(NULL));
        s_random_seeded = 1;
    }

    /* 检查参数有效性 */
    if (min > max) {
        /* 交换 min 和 max */
        int temp = min;
        min = max;
        max = temp;
    }

    /* 生成 [min, max] 范围内的随机整数 */
    int range = max - min + 1;
    return rand() % range + min;
}

/* ===== 数组工具 ===== */

void print_int_array(const int arr[], int size) {
    if (arr == NULL || size <= 0) {
        printf("[]\n");
        return;
    }

    printf("[");
    for (int i = 0; i < size; i++) {
        printf("%d", arr[i]);
        if (i < size - 1) {
            printf(", ");
        }
    }
    printf("]\n");
}
