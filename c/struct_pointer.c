#include <stdio.h>
#include <stdlib.h>

typedef struct tag{
    int a;
    int b;
    int c;
    int d;
} t_tag;

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
    t_tag t_a = {
        .a = 10,
        .b = 20,
        .c = 30,
        .d = 40,
    };

    t_tag *t_b = (t_tag *)malloc(sizeof(t_tag));
    // t_b = {
    //     .a = 10,
    //     .b = 20,
    //     .c = 30,
    //     .d = 40,
    // };
    t_b->a = 50;
    t_b->b = 60;
    t_b->c = 70;
    t_b->d = 80;

    // t_tag *t_c = {100, 200, 300, 400};
    t_tag *t_c = (t_tag *)malloc(sizeof(t_tag));
    // *t_c = {0x50, 0x60, 0x70, 0x80};
    t_c->a = 0x50;
    t_c->b = 0x60;
    t_c->c = 0x70;
    t_c->d = 0x80;

    t_tag t_d = {0x100, 0x200, 0x300, 0x400};

    mem_print((int *)(&t_a), sizeof(t_tag) / 4);
    mem_print((int *)(t_b), sizeof(t_tag) / 4);
    mem_print((int *)(t_c), sizeof(t_tag) / 4);
    mem_print((int *)(&t_d), sizeof(t_tag) / 4);

    return 0;
}