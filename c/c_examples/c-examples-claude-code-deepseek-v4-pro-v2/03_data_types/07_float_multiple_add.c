#include <stdio.h>

void main() {
    float sum;
    int i;

    // 将保存总和的变量清0
    sum = 0;

    //0.1 相加100 次
    for (i = 1; i <= 100; i++) {
        sum += 0.1;
    }

    // 显示结果
    printf("%f\n", sum);
}