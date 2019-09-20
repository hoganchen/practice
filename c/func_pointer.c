#include <stdio.h>

int add(int x, int y)
{
    return x + y;
}

int main()
{
    int (*p)(int, int) = add;

    printf("add(3, 2) = %d\n", add(3, 2));
    printf("p(13, 12) = %d\n", p(13, 12));

    /* code */
    return 0;
}