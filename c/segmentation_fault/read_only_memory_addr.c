#include<stdio.h>
#include<stdlib.h>
#include<string.h>

// 访问只读的内存地址
void main()
{
    char *ptr = "test";
    strcpy(ptr, "TEST");
}