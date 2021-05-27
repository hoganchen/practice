#include <stdio.h>
#include <string.h>

#define ARRAY_LEN 16

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
    int arr_01[ARRAY_LEN];
    int arr_02[ARRAY_LEN] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};
    int arr_03[ARRAY_LEN];
    int arr_04[ARRAY_LEN] = {0xff}; //第一个元素后的所有元素都被初始化为0

    memset(arr_03, 0, sizeof(arr_03));

    printf("arr_01 content:\n");
    mem_print(arr_01, ARRAY_LEN);
    printf("\n");

    printf("arr_02 content:\n");
    mem_print(arr_02, ARRAY_LEN);
    printf("\n");

    printf("arr_03 content:\n");
    mem_print(arr_03, ARRAY_LEN);
    printf("\n");

    printf("arr_04 content:\n");
    mem_print(arr_04, ARRAY_LEN);
    printf("\n");

    return 0;
}
