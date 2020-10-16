#include <stdio.h>

int * pointer_func()
{
    int x = 10;
    printf("&x = %p\n", &x);
    return &x;
}

void pointer_func_01(int *i)
{
    int x = 10;
    i = &x;
    printf("&x = %p, i = %p\n", &x, i);
}

int main(void)
{
    // int *i = NULL, *j = NULL;
    // 由于m和n指向了0地址，所以如下的*m = 8; *n = 9赋值会失败，出现segmentation fault，因为是向0地址写值
    // 如果m和n指针不初始化，也得注意m和n的地址是否指向的是可写地址
    // int *m = NULL, *n = NULL;
    int *m, *n;
    printf("m = %p, n = %p\n", m, n);
    *m = 8;
    *n = 9;

    int x = 1, y = 2;
    int *i, *j;
    i = &x;
    j = &y;

    printf("i = %p, j = %p\n", i, j);
    printf("&i = %p, &j = %p\n", &i, &j);
    printf("*i = %d, *j = %d\n", *i, *j);
    printf("*i == *j ? %d\n", i == j);

    pointer_func_01(i);
    pointer_func_01(j);
    printf("i = %p, j = %p\n", i, j);
    printf("&i = %p, &j = %p\n", &i, &j);
    printf("*i = %d, *j = %d\n", *i, *j);
    printf("*i == *j ? %d\n", i == j);

    i = pointer_func();
    j = pointer_func();
    printf("i = %p, j = %p\n", i, j);
    printf("&i = %p, &j = %p\n", &i, &j);
    printf("*i = %d, *j = %d\n", *i, *j);
    printf("*i == *j ? %d\n", i == j);

    *i = 100; *j = 200;
    printf("i = %p, j = %p\n", i, j);
    printf("*i = %d, *j = %d\n", *i, *j);
    printf("*i == *j ? %d\n", i == j);

}