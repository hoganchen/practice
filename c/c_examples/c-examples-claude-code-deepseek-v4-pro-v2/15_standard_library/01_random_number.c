/*
 * 知识点：随机数生成 (Random Number Generation)
 *
 * 编译指令：gcc 01_random_number.c -o 01_random_number.exe -std=c11 -Wall
 * 运行指令：./01_random_number.exe
 *
 * 本文件演示 C 标准库中的随机数生成功能：
 *   - rand()  —— 生成伪随机整数，范围 0 ~ RAND_MAX
 *   - srand() —— 用种子初始化随机数生成器
 *   - time()  —— 用当前时间作为种子，保证每次运行结果不同
 *   - 在指定区间 [min, max] 内生成随机数
 *
 * 重要说明：
 *   rand() 生成的是伪随机数，统计质量较低，不适用于密码学场景。
 *   对于安全敏感的随机数需求，应使用操作系统提供的加密随机源。
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

/*
 * 打印数组中的整数
 * arr: 待打印的数组
 * count: 数组元素个数
 */
void print_array(const int arr[], int count) {
    for (int i = 0; i < count; i++) {
        printf("%4d ", arr[i]);
        /* 每行显示 10 个数，方便阅读 */
        if ((i + 1) % 10 == 0) {
            printf("\n");
        }
    }
    printf("\n");
}

int main() {
    /* ===== 1. 基本随机数生成 ===== */
    printf("===== 1. 基本随机数 =====\n");

    /* 使用当前时间作为随机种子
     * time(NULL) 返回当前日历时间（自 1970-01-01 以来的秒数）
     * 每次运行程序时时间不同，因此随机数序列也不同 */
    srand((unsigned int)time(NULL));

    /* rand() 返回 0 ~ RAND_MAX 之间的整数（RAND_MAX 通常为 32767） */
    printf("RAND_MAX = %d\n\n", RAND_MAX);

    printf("10 个基本随机数 (0 ~ RAND_MAX):\n");
    for (int i = 0; i < 10; i++) {
        printf("  %d\n", rand());
    }

    /* ===== 2. 生成指定区间内的随机数 ===== */
    printf("\n===== 2. 区间随机数 [1, 100] =====\n");

    /* 公式：rand() % (max - min + 1) + min
     * 原理：将 rand() 的结果映射到 [0, range) 区间，再平移
     * 注意：当 range 不能整除 RAND_MAX+1 时，分布会有微小偏差 */
    int min = 1;
    int max = 100;
    int range = max - min + 1;

    printf("生成 20 个 [%d, %d] 范围内的随机数:\n", min, max);
    int numbers[20];
    for (int i = 0; i < 20; i++) {
        numbers[i] = rand() % range + min;
    }
    print_array(numbers, 20);

    /* ===== 3. 掷骰子模拟 ===== */
    printf("\n===== 3. 掷骰子模拟 (1~6) =====\n");

    int dice_rolls[10];
    for (int i = 0; i < 10; i++) {
        /* 骰子范围：1 ~ 6 */
        dice_rolls[i] = rand() % 6 + 1;
    }
    printf("掷 10 次骰子的结果:\n");
    print_array(dice_rolls, 10);

    /* ===== 4. 演示随机种子的重要性 ===== */
    printf("\n===== 4. 固定种子的可重复性 =====\n");

    /* 使用固定种子 42，每次运行生成的序列都相同
     * 这在调试和测试中非常有用 */
    srand(42);
    printf("种子为 42 时的前 5 个随机数:\n");
    for (int i = 0; i < 5; i++) {
        printf("  %d", rand());
    }
    printf("\n");

    /* 再次设置相同种子，将得到完全相同的序列 */
    srand(42);
    printf("重新设置种子 42 后，再次生成:\n");
    for (int i = 0; i < 5; i++) {
        printf("  %d", rand());
    }
    printf("\n");

    /* ===== 5. 随机数的质量说明 ===== */
    printf("\n===== 5. 随机数质量说明 =====\n");
    printf("rand() 的局限性：\n");
    printf("  - 线性同余生成器 (LCG)，统计质量较低\n");
    printf("  - 周期有限（通常为 2^31 或 2^32）\n");
    printf("  - 低位随机性较差（最低几位有周期性规律）\n");
    printf("  - 绝对不应用于密码学、安全令牌等场景！\n");
    printf("  - 安全场景应使用：/dev/urandom, BCryptGenRandom, arc4random 等\n");

    return 0;
}
