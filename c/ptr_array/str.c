#include <stdio.h>
#include "str.h"

char buff[ARR_LEN];

int print_func(void)
{
    for(int i = 0; i < ARR_LEN; i++) {
        printf("buff[%02d] = 0x%02x", i, buff[i]);
    }
    return 0;
}
