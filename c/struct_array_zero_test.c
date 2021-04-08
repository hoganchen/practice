#include <stdio.h>
#include <stdlib.h>

struct zero_buffer
{
    int     len;
    char    data[0];
} __attribute__((packed));

void mem_print(int *p, int size)
{
    int i = 0;
    int line_num = 0;
    int int_size = (size - 1) / sizeof(int) + 1;
    // printf("size: %d, int_size: %d\n", size, int_size);

    printf("%p ", p);

    for(i = 0; i < int_size; i++)
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
            if (i < int_size - 1)
            {
                printf("\n");
                printf("%p ", p);
                line_num = 0;
            }
        }
    }

    printf("\n\n");
}

int main(void)
{
    struct zero_buffer z_buf = {
        .len = 10,
    };

    struct zero_buffer d_buf;
    struct zero_buffer *p_buf = NULL;

    // d_buf = z_buf;
    p_buf = (struct zero_buffer *)malloc(sizeof(struct zero_buffer) + 100);

    printf("sizeof(z_buf): %ld, sizeof(d_buf): %ld, sizeof(*p_buf): %ld, sizeof(p_buf): %ld\n\n", sizeof(z_buf), sizeof(d_buf), sizeof(*p_buf), sizeof(p_buf));

    mem_print((int *)(&z_buf), 16);
    mem_print((int *)(&d_buf), 16);
    mem_print((int *)(p_buf), 16);

    return 0;
}
