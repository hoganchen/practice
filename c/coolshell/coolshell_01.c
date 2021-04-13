#include <stdio.h>

int f()
{
    int x;

    // printf("x = 0x%x, &x = %p\n", x, &x);

    if (x == (1 && x))
    {
        printf("1. x = %d, (1 && x) = %d\n", x, (1 && x));
    }
    else
    {
        printf("2. x = %d, (1 && x) = %d\n", x, (1 && x));
    }

    return x == (1 && x);
}

//ff与f函数的区别在于多了一个打印，然而在f函数中，ｘ的初始值为0，而在ff函数中，x的值与x的地址还有关系，待分析
int ff()
{
    int x;

    printf("x = 0x%x, &x = %p\n", x, &x);

    if (x == (1 && x))
    {
        printf("1. x = %d, (1 && x) = %d\n", x, (1 && x));
    }
    else
    {
        printf("2. x = %d, (1 && x) = %d\n", x, (1 && x));
    }

    return x == (1 && x);
}

int main(void)
{
    int i = f();
    printf("i = %d\n", i);

    int j = ff();
    printf("j = %d\n", j);

    return 0;
}
