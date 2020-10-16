#include <stdio.h>

int *g_i = NULL;

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