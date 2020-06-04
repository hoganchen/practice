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

/*
https://www.ibm.com/developerworks/cn/linux/l-pthred/
https://www.cnblogs.com/skynet/archive/2010/10/30/1865267.html

#include <pthread.h>

int pthread_create(pthread_t *tid, const pthread_attr_t *attr, void *(*func) (void *), void *arg);
int pthread_join (pthread_t tid, void ** status);
pthread_t pthread_self (void);
int pthread_detach (pthread_t tid);
void pthread_exit (void *status);

1. pthread_create用于创建一个线程，成功返回0，否则返回Exxx（为正数）。

    pthread_t *tid：线程id的类型为pthread_t，通常为无符号整型，当调用pthread_create成功时，通过*tid指针返回。
    const pthread_attr_t *attr：指定创建线程的属性，如线程优先级、初始栈大小、是否为守护进程等。可以使用NULL来使用默认值，通常情况下我们都是使用默认值。
    void *(*func) (void *)：函数指针func，指定当新的线程创建之后，将执行的函数。
    void *arg：线程将执行的函数的参数。如果想传递多个参数，请将它们封装在一个结构体中。

2. pthread_join用于等待某个线程退出，成功返回0，否则返回Exxx（为正数）。

    pthread_t tid：指定要等待的线程ID
    void ** status：如果不为NULL，那么线程的返回值存储在status指向的空间中（这就是为什么status是二级指针的原因！这种才参数也称为“值-结果”参数）。

3. pthread_self用于返回当前线程的ID。

4. pthread_detach用于是指定线程变为分离状态，就像进程脱离终端而变为后台进程类似。成功返回0，否则返回Exxx（为正数）。
变为分离状态的线程，如果线程退出，它的所有资源将全部释放。而如果不是分离状态，线程必须保留它的线程ID，退出状态直到其它线程对它调用了pthread_join。

    进程也是类似，这也是当我们打开进程管理器的时候，发现有很多僵死进程的原因！也是为什么一定要有僵死这个进程状态。

5. pthread_exit用于终止线程，可以指定返回值，以便其他线程通过pthread_join函数获取该线程的返回值。

    void *status：指针线程终止的返回值。


互斥锁的相关操作函数如下：

#include <pthread.h>

int pthread_mutex_lock(pthread_mutex_t * mptr);
int pthread_mutex_unlock(pthread_mutex_t * mptr);
//Both return: 0 if OK, positive Exxx value on error

在对临界资源进行操作之前需要pthread_mutex_lock先加锁，操作完之后pthread_mutex_unlock再解锁。而且在这之前需要声明一个pthread_mutex_t类型的变量，用作前面两个函数的参数。


条件变量的相关函数如下：

#include <pthread.h>

int pthread_cond_wait(pthread_cond_t *cptr, pthread_mutex_t *mptr);
int pthread_cond_signal(pthread_cond_t *cptr);
//Both return: 0 if OK, positive Exxx value on error

pthread_cond_wait用于等待某个特定的条件为真，pthread_cond_signal用于通知阻塞的线程某个特定的条件为真了。在调用者两个函数之前需要声明一个pthread_cond_t类型的变量，用于这两个函数的参数。

为什么条件变量始终与互斥锁一起使用，对条件的测试是在互斥锁（互斥）的保护下进行的呢？因为“某个特性条件”通常是在多个线程之间共享的某个变量。互斥锁允许这个变量可以在不同的线程中设置和检测。

通常，pthread_cond_wait只是唤醒等待某个条件变量的一个线程。如果需要唤醒所有等待某个条件变量的线程，需要调用：

int pthread_cond_broadcast (pthread_cond_t * cptr);

默认情况下面，阻塞的线程会一直等待，知道某个条件变量为真。如果想设置最大的阻塞时间可以调用：

int pthread_cond_timedwait (pthread_cond_t * cptr, pthread_mutex_t *mptr, const struct timespec *abstime);

如果时间到了，条件变量还没有为真，仍然返回，返回值为ETIME。
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