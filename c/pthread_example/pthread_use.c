/*
 * 1）有一int型全局变量g_Flag初始值为0；
 *
 * 2）在主线称中起动线程1，打印“this is thread1”，并将g_Flag设置为1
 *
 * 3）在主线称中启动线程2，打印“this is thread2”，并将g_Flag设置为2
 *
 */
#include<stdio.h>
#include<stdlib.h>
#include<pthread.h>
#include<errno.h>
#include<unistd.h>
#include<string.h>

int g_Flag=0;

void* thread1(void*);
void* thread2(void*);

/*
 * when program is started, a single thread is created, called the initial thread or main thread.
 * Additional threads are created by pthread_create.
 * So we just need to create two thread in main().
 */

/*
https://www.cnblogs.com/skynet/archive/2010/10/30/1865267.html
https://www.ibm.com/developerworks/cn/linux/l-pthred/

$ gcc -o pthread_use pthread_use.c -lpthread

$ ./pthread_use
enter main
enter thread2
leave main
this is thread2, g_Flag: 0, thread id is 1842566912
this is thread2, g_Flag: 2, thread id is 1842566912
leave thread2
enter thread1
this is thread1, g_Flag: 2, thread id is 1834174208
this is thread1, g_Flag: 1, thread id is 1834174208
leave thread1
$ ./pthread_use
enter main
leave main
enter thread2
enter thread1
this is thread1, g_Flag: 0, thread id is 1340819200
this is thread1, g_Flag: 1, thread id is 1340819200
leave thread1
this is thread2, g_Flag: 0, thread id is 1349211904
this is thread2, g_Flag: 2, thread id is 1349211904
leave thread2
*/
int main(int argc, char** argv)
{
	printf("enter main\n");
	pthread_t tid1, tid2;
	int rc1=0, rc2=0;

	rc2 = pthread_create(&tid2, NULL, thread2, NULL);
	if(rc2 != 0)
		printf("%s: %s\n",__func__, strerror(rc2));

	rc1 = pthread_create(&tid1, NULL, thread1, &tid2);
	if(rc1 != 0)
		printf("%s: %s\n",__func__, strerror(rc1));

	printf("leave main\n");
    pthread_join(tid1, NULL);
    pthread_join(tid2, NULL);
	exit(0);
}
/*
 * thread1() will be execute by thread1, after pthread_create()
 * it will set g_Flag = 1;
 */
void* thread1(void* arg)
{
	printf("enter thread1\n");
	printf("this is thread1, g_Flag: %d, thread id is %u\n",g_Flag, (unsigned int)pthread_self());
	g_Flag = 1;
	printf("this is thread1, g_Flag: %d, thread id is %u\n",g_Flag, (unsigned int)pthread_self());
	printf("leave thread1\n");
	pthread_exit(0);
}

/*
 * thread2() will be execute by thread2, after pthread_create()
 * it will set g_Flag = 2;
 */
void* thread2(void* arg)
{
	printf("enter thread2\n");
	printf("this is thread2, g_Flag: %d, thread id is %u\n",g_Flag, (unsigned int)pthread_self());
	g_Flag = 2;
	printf("this is thread2, g_Flag: %d, thread id is %u\n",g_Flag, (unsigned int)pthread_self());
	printf("leave thread2\n");
	pthread_exit(0);
}