#include <stdio.h>
#include <time.h>

int main(int argc, char const *argv[])
{
    /* code */
    srand(time(0));
    int i = rand();
    int *p = &i;

    printf("i = 0x%x\n", i);
    *p = (*p & 0xfff803ff) | (0x0084 << 10);
    printf("i = 0x%x\n", i);

    return 0;
}