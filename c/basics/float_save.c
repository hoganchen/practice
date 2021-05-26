#include <stdio.h>

int main(void)
{
    float x = 1234.5678;
    unsigned char *p = (unsigned char *)(&x) + sizeof(float) - 1;

    for(int i = 0; i < sizeof(float); i++)
    {
        printf("%d%d%d%d %d%d%d%d ", (*p & 0x80) >> 7, (*p & 0x40) >> 6, (*p & 0x20) >> 5, (*p & 0x10) >> 4, (*p & 0x08) >> 3, (*p & 0x04) >> 2, (*p & 0x02) >> 1, *p & 0x01);
        p--;
    }

    printf("\n");

    unsigned int y = 0x12345678;
    p = (unsigned char *)(&y) + sizeof(int) - 1;

    for(int i = 0; i < sizeof(float); i++)
    {
        printf("%d%d%d%d %d%d%d%d ", (*p & 0x80) >> 7, (*p & 0x40) >> 6, (*p & 0x20) >> 5, (*p & 0x10) >> 4, (*p & 0x08) >> 3, (*p & 0x04) >> 2, (*p & 0x02) >> 1, *p & 0x01);
        p--;
    }

    printf("\n");
    return 0;
}
