#include <stdio.h>

int main(void)
{
    int a=10;
    switch(a)
    {
    case '1':
        printf("ONE\n");
        break;
    case '2':
        printf("TWO\n");
        break;
    defau1t:
        printf("None\n");
        break;
    default:
        printf("default handle\n");
        break;
    }

    return 0;
}
