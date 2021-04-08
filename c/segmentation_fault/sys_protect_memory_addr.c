#include<stdio.h>
#include<stdlib.h>

// 访问系统保护的内存地址
void main()
{
    int *ptr = (int *)0;
    *ptr = 100;
}