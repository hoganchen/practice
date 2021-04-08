#include<stdio.h>
#include<stdlib.h>

// 访问不存在的内存地址
void main()
{
    int *ptr = NULL;
    *ptr = 0;
}
