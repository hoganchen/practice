#include <stdio.h>

//return 1 : little-endian
//       0 : big-endian
int checkCPUendian()
{
    union {
        unsigned int a;
        unsigned char b;
    } c;

    c.a = 1;
    return (c.b == 1);
}

int main(void)
{
    int x = 0x12345678;

#if 0
    char *p = (char *)&x;

    printf("p = %02x\n", *p);

    if(0x78 == *p) {
        printf("Little Endian\n");
    } else {
        printf("Big Endian\n");
    }
#else
    char y = *(char *)&x;

    if(0x78 == y) {
        printf("Little Endian\n");
    } else {
        printf("Big Endian\n");
    }
#endif

    if (checkCPUendian()) {
        printf("Little Endian\n");
    } else {
        printf("Big Endian\n");
    }

    /* code */
    return 0;
}