#include <stdio.h>
#include <stdlib.h>

int main(int argc, char **argv)
{
    int v = 3;
    printf("Code is at %p \n", (void *)main);
    printf("Stack is at %p \n", (void *)&v);
    printf("Heap is at %p \n", malloc(8));
    return 0;
}