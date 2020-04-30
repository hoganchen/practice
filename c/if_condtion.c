#include <stdio.h>

int main(void)
{
    int i = 0, *p = NULL;

    for(i = 0; i < 10; i++)
    {
        if(i)
        {
            printf("condition value: %d\n", i);
        }
    }

    for(i = 0; i < 10; i++)
    {
        p = &i;
        if(p)
        {
            printf("condition value: %d\n", *p);
        }
    }

}