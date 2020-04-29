#include <stdio.h>
#include <string.h>

int main(void)
{
    // 以下三种都是把数组的所有元素初始化为0
    // signed char a[1000] = {0, };
    // signed char a[1000] = {0};
    // signed char a[1000] = {};
    signed char a[1000] = {1, 2, 3, 4, 5};

    char b[100] = "hello0, world";
    int i = 0;

    printf("strlen(b) = %d\n", strlen(b));
    b[4] = 0;
    printf("strlen(b) = %d\n", strlen(b));

    if(0 == '\0')
    {
        printf("equal\n");
    }
    else
    {
        printf("no equal\n");
    }


    for(i = 0; i < 1000; i++)
    {
        printf("%d ", a[i]);
    }

    for(i = 0; i < 1000; i++)
    {
        a[i] = -1 -i;
    }

    printf("\n");

    for(i = 0; i < 1000; i++)
    {
        printf("%d ", a[i]);
    }

    int str_len = strlen(a);

    printf("%d\n", str_len);

    return 0;
}
