#include <stdio.h>
#include <math.h>

int is_prime(unsigned long long number)
{
    unsigned int retval = 1;

    if(number <= 1)
    {
        retval = 0;
    }
    else
    {
        unsigned long long sqrt_number = (unsigned long long)sqrt(number);
        for(unsigned long long i = 0; i < sqrt_number; i++)
        {
            if(0 == number % i)
            {
                retval = 0;
                break;
            }
        }
    }

    return retval;
}

int main(void)
{

    return 0;
}