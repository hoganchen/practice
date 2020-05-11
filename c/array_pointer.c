#include <stdio.h>

int main(void)
{
    int int_array[] = {1, 2, 3, 4};
    int *p = int_array;

    printf("int_array = %p\n", int_array);
    printf("p = %p\n", p);
    printf("&int_array = %p\n", &int_array);
    printf("int_array[0] = %p\n", &int_array[0]);
    printf("(&int_array + 1) = %p\n", &int_array + 1);
    printf("(&int_array + 5) = %p\n", &int_array + 5);
    printf("p + 1 = %p\n", p + 1);

    return 0;
}
