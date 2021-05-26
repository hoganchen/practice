#include <stdio.h>
#include <string.h>

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
    int x = 0xffffffff;

    //unsigned char p[] = {0xff, 0xff, 0xff, 0xff};
    unsigned char p[] = {0xff, 0xff};

    //unsigned char ptr[] = {'a', 'b', 'c', 'd', 'e', '\0'};
    unsigned char ptr[] = {'a', 'b', 'c', 'd'};

    printf("ptr address: %p, x address: %p, p address: %p\n\n", ptr, &x, p);
    printf("strlen(ptr) = %ld, sizeof(ptr) = %ld\n", strlen(ptr), sizeof(ptr));

    unsigned char *pt = (unsigned char *)ptr;

    // printf("%p ", pt);
    // for(int i = 0; i < 16; i++)
    // {
    //     printf("%02x ", *pt);
    //     pt++;
    // }
    // printf("\n\n");

    mem_print((int *)ptr, 16);

    printf("\n\n");

    pt = (unsigned char *)(&x);

    // printf("%p ", pt);
    // for(int i = 0; i < 16; i++)
    // {
    //     printf("%02x%02x%02x%02x ", *pt, *(pt+1), *(pt+2), *(pt+3));
    //     pt += 4;

    //     if(3 == i % 4)
    //     {
    //         printf("\n");
    //         printf("%p ", pt);
    //     }
    // }
    // printf("\n\n");

    mem_print((int *)(&x), 64);

    printf("\n");

    return 0;
}
