#include <stdio.h>

int main()
{
    unsigned int xx = 0xffffffff;

    printf("xx = %x\n", xx);

    xx += 1;

    printf("xx = %x\n", xx);

    /* code */
    return 0;
}