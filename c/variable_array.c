#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct st_type1
{
    int     cnt;
    char    item[0];
} type_a;

typedef struct st_type2
{
    int     cnt;
    char    item[];
} type_b;

typedef struct st_type3
{
    int     cnt;
    char    item[1];
} type_c;

typedef struct st_type4
{
    int     cnt;
    char    *data;
} type_d;

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
    printf("len: %ld\n", sizeof(type_a));
    printf("len: %ld\n", sizeof(type_b));
    printf("len: %ld\n", sizeof(type_c));
    printf("len: %ld\n", sizeof(type_d));

    type_a  a;
    type_a  *p_a = (type_a *)malloc(sizeof(type_a) + 100 * sizeof(char));
    // strcpy(p_a->item, "type_a");
    // printf("p_a->item:%s\n", p_a->item);

    p_a->cnt = 100;
    for(int i = 0; i < 100; i++)
    {
        p_a->item[i] = 0x11 + i;
    }

    mem_print((int *)(p_a), (int)((sizeof(type_a) + 100 * sizeof(char)) / 4));

    free(p_a);

    type_d  d;
    d.data = malloc(100 * sizeof(char));
    // strcpy(d.data, "type_d");
    // printf("d.data:%s\n", d.data);

    d.cnt = 100;
    for(int i = 0; i < 100; i++)
    {
        d.data[i] = 0x11 + i;
    }

    mem_print((int *)(&d), (int)((sizeof(type_d) + 100 * sizeof(char)) / 4));
    mem_print((int *)(d.data), (int)((100 * sizeof(char))/ 4));

    free(d.data);

    return 0;
}