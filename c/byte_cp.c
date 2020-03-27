#include "stdio.h"

int main(void)
{
    char test[] = {0xff, 0xff, 0xff, 0xff, 0x12, 0x34, 0x56, 0x78, 0x90};

    unsigned int cmd = 0xffffff;
    unsigned int int_test = *((unsigned int *)test) >> 8;

    printf("*((unsigned int *)test): 0x%x\n", *((unsigned int *)test));
    printf("cmd: 0x%x, int_test: 0x%x\n", cmd, int_test);

    if (int_test == cmd)
    {
        printf("equal\n");
    }
    else
    {
        printf("no equal\n");
    }

    /* code */
    return 0;
}