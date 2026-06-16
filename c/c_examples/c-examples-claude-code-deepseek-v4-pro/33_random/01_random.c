/*
 * ============================================
 * 知识点：随机数生成 <stdlib.h> / <time.h>
 * 说明：
 *   C 标准库提供 rand() 和 srand() 生成伪随机数。
 *
 *   核心函数：
 *   rand()   — 返回 0 到 RAND_MAX 之间的伪随机整数
 *   srand()  — 设置随机数种子（通常用 time(NULL) 做种子）
 *
 *   扩展（POSIX/BSD）：
 *   random() / srandom() — 质量更好的随机数
 *   arc4random()         — 密码学安全的随机数（BSD/macOS）
 *
 *   注意：rand() 的随机质量一般，不适合密码学应用。
 *   生产环境考虑使用 PCG、xorshift 等更好的算法。
 *
 * 编译方法：
 *   gcc 01_random.c -o 01_random
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>   // rand, srand, RAND_MAX
#include <time.h>     // time 用于种子
#include <stdbool.h>  // bool 类型

// ========== 1. 基础随机数 ==========
void basic_random(void) {
    printf("--- 基础随机数 ---\n");

    // 设置种子（不设置则每次运行结果相同）
    srand((unsigned int)time(NULL));

    printf("5 个随机数 (0 ~ %d):\n", RAND_MAX);
    for (int i = 0; i < 5; i++) {
        printf("  %d\n", rand());
    }
}

// ========== 2. 指定范围 ==========
/*
 * 生成 [min, max] 范围内的随机整数
 * 注意：简单的 % 运算会导致分布不均匀（当范围不能整除 RAND_MAX 时）
 */
int rand_range(int min, int max) {
    // 改进的均匀分布算法
    int range = max - min + 1;
    int limit = RAND_MAX - (RAND_MAX % range);
    int r;

    // 丢弃会导致不均匀的部分
    do {
        r = rand();
    } while (r >= limit);

    return min + (r % range);
}

void ranged_random(void) {
    printf("\n--- 指定范围随机数 ---\n");

    printf("骰子点数 (1~6):\n");
    for (int i = 0; i < 10; i++) {
        printf("  %d ", rand_range(1, 6));
    }
    printf("\n");

    printf("\n考试成绩 (60~100):\n");
    for (int i = 0; i < 8; i++) {
        printf("  %d ", rand_range(60, 100));
    }
    printf("\n");
}

// ========== 3. 随机浮点数 ==========
double rand_double(void) {
    // 生成 [0.0, 1.0) 范围内的随机浮点数
    return (double)rand() / (RAND_MAX + 1.0);
}

double rand_double_range(double min, double max) {
    return min + rand_double() * (max - min);
}

void float_random(void) {
    printf("\n--- 随机浮点数 ---\n");

    printf("[0,1) 范围:\n");
    for (int i = 0; i < 5; i++) {
        printf("  %.6f\n", rand_double());
    }

    printf("\n[-10, 10] 范围:\n");
    for (int i = 0; i < 5; i++) {
        printf("  %.2f ", rand_double_range(-10.0, 10.0));
    }
    printf("\n");
}

// ========== 4. 随机布尔值 ==========
bool rand_bool(double true_probability) {
    return rand_double() < true_probability;
}

// ========== 5. 打乱数组（Fisher-Yates shuffle）==========
void shuffle(int arr[], int n) {
    for (int i = n - 1; i > 0; i--) {
        int j = rand_range(0, i);  // 随机选一个位置
        // 交换 i 和 j
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}

// ========== 6. 从数组中随机选取 ==========
int random_choice(const int arr[], int n) {
    return arr[rand_range(0, n - 1)];
}

// ========== 7. 随机种子对结果的影响 ==========
void seed_demo(void) {
    printf("\n--- 种子对随机数的影响 ---\n");

    printf("相同种子产生相同序列:\n");
    srand(42);
    for (int i = 0; i < 5; i++) printf("%d ", rand());
    printf("\n");

    srand(42);  // 重置种子
    for (int i = 0; i < 5; i++) printf("%d ", rand());
    printf("  (与上面相同)\n");

    printf("\n不同种子产生不同序列:\n");
    srand(123);
    for (int i = 0; i < 5; i++) printf("%d ", rand());
    printf("  (不同)\n");
}

// ========== 8. 模拟：抛硬币 ==========
void coin_flip_simulation(void) {
    printf("\n--- 模拟：抛硬币 1000 次 ---\n");

    srand((unsigned int)time(NULL));

    int heads = 0, tails = 0;
    for (int i = 0; i < 1000; i++) {
        if (rand() % 2 == 0) {
            heads++;
        } else {
            tails++;
        }
    }

    printf("正面: %d (%.1f%%)\n", heads, heads / 10.0);
    printf("反面: %d (%.1f%%)\n", tails, tails / 10.0);
}

// ========== 9. RAND_MAX 常量 ==========
void rand_max_info(void) {
    printf("\n--- RAND_MAX ---\n");
    printf("RAND_MAX = %d (此平台)\n", RAND_MAX);
    // Windows 上通常是 32767，Linux 上通常是 2147483647
}

// ========== main ==========
int main() {
    printf("===== 随机数生成 =====\n\n");

    basic_random();
    ranged_random();
    float_random();
    seed_demo();

    // 打乱数组
    printf("\n--- 打乱数组 ---\n");
    int cards[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int n = sizeof(cards) / sizeof(cards[0]);

    printf("原序: ");
    for (int i = 0; i < n; i++) printf("%d ", cards[i]);

    shuffle(cards, n);
    printf("\n打乱: ");
    for (int i = 0; i < n; i++) printf("%d ", cards[i]);
    printf("\n");

    // 随机选择
    printf("\n--- 随机选择 ---\n");
    char *fruits[] = {"苹果", "香蕉", "橙子", "葡萄", "西瓜"};
    int fn = sizeof(fruits) / sizeof(fruits[0]);
    srand((unsigned int)time(NULL));
    printf("今日水果: %s\n", fruits[rand_range(0, fn - 1)]);

    coin_flip_simulation();
    rand_max_info();

    // 总结
    printf("\n===== 随机数使用场景 =====\n");
    printf("游戏: 随机事件、道具掉落\n");
    printf("测试: 生成随机测试数据\n");
    printf("算法: 随机化快速排序、蒙特卡洛\n");
    printf("安全: ⚠ rand() 不适合密码学，请用专用库\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. srand(time(NULL)) 设置种子（不设则每次结果相同）
 * 2. rand() 返回 0 ~ RAND_MAX 的伪随机数
 * 3. rand_range(min, max) 生成指定范围整数
 * 4. Fisher-Yates shuffle 打乱数组
 * 5. rand() 不适合密码学场景
 * 6. 生产环境可考虑 PCG、xorshift、Mersenne Twister
 * 7. C11 提供的 rand_s() 更安全（Windows）
 * ============================================
 */
