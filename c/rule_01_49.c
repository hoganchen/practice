#include <stdio.h>

/*
main.c中语句格式如下的输出结果：
int *ptr3 = (int *)((int)a + 4);

$ ./rule_01_49
a = 0x7ffd8c2a63d0, b = 0x7ffd8c2a63f0
sizeof(a) = 32, sizeof(b) = 32
ptr1 = 0x7ffd8c2a63f0, ptr2 = 0x7ffd8c2a63d4, ptr3 = 0xffffffff8c2a63d4, sizeof(int *) = 8
Segmentation fault (core dumped)

################################################################################

main.c中语句格式如下的输出结果：
int *ptr3 = (int *)((long long)a + 4);

$ ./rule_01_49
a = 0x7fff57c4f930, b = 0x7fff57c4f950
sizeof(a) = 32, sizeof(b) = 32
ptr1 = 0x7fff57c4f950, ptr2 = 0x7fff57c4f934, ptr3 = 0x7fff57c4f934, sizeof(int *) = 8
*ptr2 = 2, *ptr3 = 2
*ptr1[-8] = 1
*ptr1[-7] = 2
*ptr1[-6] = 3
*ptr1[-5] = 4
*ptr1[-4] = 5
*ptr1[-3] = 6
*ptr1[-2] = 7
*ptr1[-1] = 8
*ptr1[0] = 9
*ptr1[1] = a
*ptr1[2] = b
*ptr1[3] = c
*ptr1[4] = d
*ptr1[5] = e
*ptr1[6] = f
*ptr1[7] = 10
*/
int main(void)
{
    int a[] = {1, 2, 3, 4, 5, 6, 7, 8};
    int b[] = {9, 10, 11, 12, 13, 14, 15, 16};

    printf("a = %p, b = %p\n", a, b);
    printf("sizeof(a) = %ld, sizeof(b) = %ld\n", sizeof(a), sizeof(b));

    int *ptr1 = (int *)(&a + 1);
    int *ptr2 = (int *)((int *)a + 1);
    // 这个地方只能加上数据类型的整数倍长度，不然由于字节不对齐，出现Segmentation fault (core dumped)，
    // 而且不能使用(int)a，这样转换后为指针为4个字节，而64位系统的指针长度为8个字节，所以ptr3的高4个字节为ffffffff，
    // 在打印ptr3的值的时候，也会出现Segmentation fault (core dumped)
    // 更正，与字节对齐没有关系，出现Segmentation fault (core dumped)就是ptr3的高4个字节为ffffffff导致
    /*
    $ ./rule_01_49
    a = 0x7ffd8c2a63d0, b = 0x7ffd8c2a63f0
    sizeof(a) = 32, sizeof(b) = 32
    ptr1 = 0x7ffd8c2a63f0, ptr2 = 0x7ffd8c2a63d4, ptr3 = 0xffffffff8c2a63d4, sizeof(int *) = 8
    Segmentation fault (core dumped)
    */
    // int *ptr3 = (int *)((int)a + 1);
    int *ptr3 = (int *)((long long)a + 4);

    printf("ptr1 = %p, ptr2 = %p, ptr3 = %p, sizeof(int *) = %ld\n", ptr1, ptr2, ptr3, sizeof(int *));

    // printf("ptr1[-5] = %x, *ptr2 = %x\n", ptr1[-5], *ptr2);
    printf("*ptr2 = %x, *ptr3 = %x\n", *ptr2, *ptr3);

    int start = (int)(0 - sizeof(a) / sizeof(a[0]));
    int end = sizeof(b) / sizeof(b[0]);

    for(int i = start; i < end; i++)
    {
        printf("*ptr1[%d] = %x\n", i, ptr1[i]);
    }

    return 0;
}
