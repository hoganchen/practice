#include <stdio.h>

void mem_print(int *p, int size)
{
    int i = 0;
    int line_num = 0;

    printf("%p ", p);

    for(i = 0; i < size; i++)
    {
        printf("%08x", *p);
        p++;
        if(line_num < 3)
        {
            printf(" ");
            line_num++;
        }
        else
        {
            printf("\n");
            printf("%p ", p);
            line_num = 0;
        }
    }

    printf("\n");
}

int main(void)
{
    signed int i = -20;
    unsigned int j = 10;
    signed int m = 0, n = -0;

    printf("i + j = %d\n", i + j);

    mem_print(&i, 8);
    printf("\n");
    mem_print(&j, 4);
    printf("\n");

    mem_print(&m, 4);
    printf("\n");
    mem_print(&n, 4);
    printf("\n");

    return 0;
}
