#include <stdio.h>

int main()
{
    float sum = 0;
    double total = 0;
    int i = 0;

    for (i = 0; i < 100; i++) {
        sum += 0.1;
        total += 0.1;
    }

    printf("sum = %f, total = %f\n", sum, total);

    /* code */
    return 0;
}