#include <stdio.h>
#include <stdlib.h>

struct zero_buffer
{
    int     len;
    char    data[0];
};

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
    struct zero_buffer z_buf = {
        .len = 10,
    };

    struct zero_buffer d_buf;
    struct zero_buffer *p_buf = NULL;

    p_buf = (struct zero_buffer *)malloc(sizeof(struct zero_buffer) + 100);
    p_buf->len = 100;
    p_buf->data[0] = 0x11;
    p_buf->data[1] = 0x22;
    *(int *)&(p_buf->data[4]) = 0x99887766;

    d_buf = z_buf;

    printf("%08x\n", *(int *)&(p_buf->data[0]));

    mem_print((int *)(&z_buf), sizeof(z_buf));
    mem_print((int *)(&d_buf), sizeof(d_buf));
    mem_print((int *)(p_buf), sizeof(z_buf));

    return 0;
}