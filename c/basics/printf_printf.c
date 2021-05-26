#include <stdio.h>

int main(void)
{
    int i = 43;
    int j = 0;

    j = printf("i = %d\n", i);
    printf("j = %d\n", j);
    printf("%d\n", printf("%d", printf("%d", i)));

    return 0;
}
