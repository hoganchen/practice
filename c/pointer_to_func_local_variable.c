#include <stdio.h>

int *g_i = NULL;

// 结合形参，实参之间是值传递来理解，即在调用该函数时，会生成对应的形参变量，并把实参变量的值拷贝到形参变量中，当函数结束时，形参变量被销毁
// 从而可以看出，想要改变指针所指向的对象，需要用指针的指针方式
void pointer_func(int **i)
{
    int x = 10;
    *i = &x;
    printf("&x = %p, i = %p, *i = %p\n", &x, i, *i);
}

void pointer_func_global()
{
    int x = 90;
    g_i = &x;
    printf("&x = %p, g_i = %p\n", &x, g_i);
}

int main(void)
{
    int x = 99;
    int *i = NULL, *j = &x;
    printf("i = %p, &i = %p, j = %p, &x = %p, g_i = %p, &g_i = %p\n", i, &i, j, &x, g_i, &g_i);

    pointer_func(&i);

    printf("i = %p, j = %p\n", i, j);
    printf("&i = %p, &j = %p\n", &i, &j);
    printf("*i = %d, *j = %d\n", *i, *j);
    printf("*i == *j ? %d\n", i == j);

    pointer_func_global();
    printf("g_i = %p, j = %p\n", g_i, j);
    printf("&g_i = %p, &j = %p\n", &g_i, &j);
    printf("*g_i = %d, *j = %d\n", *g_i, *j);
    printf("*g_i == *j ? %d\n", g_i == j);

    return 0;
}