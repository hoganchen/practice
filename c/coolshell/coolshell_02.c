#include <stdio.h>

int x;

int f()
{
    // int x;
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
    printf("x = %d\n", x);
    int i = f();
    printf("i = %d\n", i);

    return 0;
}
