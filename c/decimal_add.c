# include <stdio.h>

void main()
{
    float sum;
    double total;
    int i;

    //将保存总和的变量清0
    sum = 0;

    //0.1相加100次
    for (i = 1; i <= 100; i++) {
        sum += 0.1;
        total += 0.1;
    }

    //显示结果
    printf("sum = %f, total = %.10f\n", sum, total);
}