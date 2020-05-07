#include <stdio.h>
#include <string.h>
#include <errno.h>

/*
https://www.runoob.com/cprogramming/c-function-strerror.html
https://linux.die.net/man/3/strerror
*/
int main ()
{
   FILE *fp;

   fp = fopen("file.txt","r");
   if( fp == NULL )
   {
      printf("Error: %s\n", strerror(errno));
   }

  return(0);
}