#include <stdio.h>

__attribute((constructor)) void before_main()
{
    printf("%s\n",__FUNCTION__);
}

__attribute((destructor)) void after_main()
{
    printf("%s\n",__FUNCTION__);
}

int main(void)
{
    printf("%s\n",__FUNCTION__);

    return 0;
}
