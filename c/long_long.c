#include <stdio.h>

int main(void)
{
    unsigned long long x = 0xffffffffffffffff;

    printf("x = 0x%016llx, x = 0x%llx, x = %llu, x = %lld\n", x, x, x, x);

    return 0;
}