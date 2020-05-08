#include <stdio.h>
#include <stdarg.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>

#include <unistd.h>
#include <getopt.h>
#include <netdb.h>
#include <pthread.h>

#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>

#define DICE_PORT 6173

int do_debug = 0;
int do_thread = 0;
int do_stdin = 0;
int do_sleep = 0;

struct sockets {
	int local;
	FILE *in, *out;
};

struct sockets *get_sockets(int);
int socket_setup(void);
int debug(char *, ...);
int fail(char *, ...);
int warn(char *, ...);
int roll_die(int);
void *roll_dice(void *);

int
debug(char *fmt, ...) {
	va_list ap;
	int r;

	va_start(ap, fmt);
	if (do_debug) {
		r = vfprintf(stderr, fmt, ap);
	} else {
		r = 0;
	}
	va_end(ap);
	return r;
}

int
warn(char *fmt, ...) {
	int r;
	va_list ap;
	va_start(ap, fmt);
	r = vfprintf(stderr, fmt, ap);
	va_end(ap);
	return r;
}
int
fail(char *fmt, ...) {
	int r;
	va_list ap;
	va_start(ap, fmt);
	r = vfprintf(stderr, fmt, ap);
	exit(1);
	/* notreached */
	va_end(ap);
	return r;
}

int
roll_die(int n) {
	return rand() % n + 1;
}

/* read dice on standard input, write results on standard output */
void *
roll_dice(void *v) {
	struct sockets *s = v;
	char inbuf[512];

	/* think globally, program defensively */
	if (!s || !s->out || !s->in)
		return NULL;
	fprintf(s->out, "enter die rolls, or q to quit\n");
	while (fgets(inbuf, sizeof(inbuf), s->in) != 0) {
		int dice;
		int size;
		if (inbuf[0] == 'q') {
			fprintf(s->out, "buh-bye!\n");
			if (s->local == 0) {
				shutdown(fileno(s->out), SHUT_RDWR);
			}
			fclose(s->out);
			fclose(s->in);
			if (s->local == 0) {
				free(s);
			}
			return 0;
		}
		if (sscanf(inbuf, "%dd%d", &dice, &size) != 2) {
			fprintf(s->out, "Sorry, but I couldn't understand that.\n");
		} else {
			int i;
			int total = 0;
			for (i = 0; i < dice; ++i) {
				int x = roll_die(size);
				total += x;

                if (i == dice - 1)
                {
                    fprintf(s->out, "%d ", x);
                }
                else
                {
                    fprintf(s->out, "%d + ", x);
                }

				fflush(s->out);
				if (do_sleep)
					sleep(1);
			}
			fprintf(s->out, "= %d\n", total);
		}
	}
	return 0;
}

int
main(int argc, char *argv[]) {
	int o;
	int sock;
	while ((o = getopt(argc, argv, "dstS")) != -1) {
		switch (o) {
		case 'S':
			do_sleep = 1;
			break;
		case 'd':
			do_debug = 1;
			break;
		case 's':
			do_stdin = 1;
			break;
		case 't':
			do_thread = 1;
			break;
		}
	}

	if (do_stdin) {
		struct sockets s;
		s.local = 1;
		s.in = stdin;
		s.out = stdout;
		if (do_thread) {
			pthread_t p;
			pthread_create(&p, NULL, roll_dice, (void *) &s);
		} else {
			roll_dice(&s);
			exit(0);
		}
	}

	sock = socket_setup();
	while (1) {
		struct sockets *s = get_sockets(sock);
		if (s) {
			if (do_thread) {
				pthread_t p;
				pthread_create(&p, NULL, roll_dice, (void *) s);
			} else {
				roll_dice(s);
				exit(0);
			}
		}
	}
	return 0;
}

int
socket_setup(void) {
	struct protoent *tcp_proto;
	struct sockaddr_in local;
	int r, s, one;

	tcp_proto = getprotobyname("tcp");
	if (!tcp_proto) {
		fail("Can't find TCP/IP protocol: %s\n", strerror(errno));
	}
	s = socket(PF_INET, SOCK_STREAM, tcp_proto->p_proto);
	if (s == -1) {
		fail("socket: %s\n", strerror(errno));
	}
	one = 1;
	setsockopt(s, SOL_SOCKET, SO_REUSEADDR, &one, sizeof(one));
	memset(&local, 0, sizeof(struct sockaddr_in));
	local.sin_family = AF_INET;
	local.sin_port = htons(DICE_PORT);
	r = bind(s, (struct sockaddr *) &local, sizeof(struct sockaddr_in));
	if (r == -1) {
		fail("bind: %s\n", strerror(errno));
	}
	r = listen(s, 5);
	if (r == -1) {
		fail("listen: %s\n", strerror(errno));
	}
	return s;
}

/*
http://blog.cuicc.com/blog/2011/06/11/host-endian-and-net-endian/

字节序(endian)是指存放多个字节的顺序，典型的字节序分类为主机字节序和网络字节序。
主机字节序(host endian)是指整数在内存中存放的顺序，有大端字节序(big-endian)和小端字节序(little-endian)两种。
网络字节序(net endian)是指TCP/IP中规定的数据表示格式，与CPU、OS无关，采用大端字节序(big-endian)存放方式。

大端字节序(big-endian)

大端字节序是指将高位字节存储在低地址空间中，也就是地址低位存储值的高位，地址高位存储值的低位。这种存储方式比较直观，阅读方便。
以四字节16进制0x01020304在内存中的存储顺序为例，假设起始地址为1000:
1000    1001    1002    1003
01  |   02  |   03  |   04

小端字节序(little-endian)

小端字节序是指将低位字节存储在低地址空间中，也就是地址低位存储值的低位，地址高位存储值的高位。这种存储方式符合我们的思维方式，比如珠算。
同样以0x01020304为例:
1000    1001    1002    1003
04  |   03  |   02  |   01

PC中的CPU大多数是以小端字节序处理多字节数据的，而网络传输时TCP/IP中是以大端字节序存储数据的。
所以在使用socket处理主机到网络或网络到主机的数据时需要大小端字节序转换。转换函数htons(), htonl(), ntohs(), ntohl().

https://blog.csdn.net/lijinqi1987/article/details/11784719
htonl：     将long型主机字节序转换为网络字节序
htons：     将short型主机字节序转换为网络字节序
ntohl：     将long型网络字节序转换为主机字节序
ntohs：     将short型网络字节序转换为主机字节序

short型数据(2字节)必须用htons转换为网络字节序，用ntohs转换回主机字节序
long型数据(4字节)必须用htonl转换为网络字节序，用ntohl转换回主机字节序
*/
struct sockets *
get_sockets(int sock) {
	int conn;
	struct sockaddr sock_addr;
	unsigned int addr_len = sizeof(struct sockaddr);
	memset(&sock_addr, 0, sizeof(struct sockaddr));

    // accept的第二个参数不为NULL，则必须设置第三个参数
    // https://blog.51cto.com/littlemo/1123888
    // https://blog.csdn.net/u011846436/article/details/39009151
    // conn = accept(sock, NULL, NULL);
    conn = accept(sock, &sock_addr, &addr_len);
	// if ((conn = accept(sock, &sock_addr, &addr_len)) < 0) {
	if (conn < 0) {
		warn("accept: %s\n", strerror(errno));
		return 0;
	} else {
		printf("connect address information: %s\n", sock_addr.sa_data);
        // sa_data中的前两个字节存放的是端口号，2~6字节存放的是地址，由于是网络字节序，所以需要用ntohs转为主机字节序
		printf("client port: %d, ", ntohs(*((unsigned short *)(sock_addr.sa_data))));
		printf("client address: ");
        // 由于IP地址4个字节，每个字节独立，所以单字节不需要转换
		for(unsigned int i = 2; i < 2 + 4; i++)
		{
			if (i == 2 + 4 - 1)
			{
				printf("%d\n", sock_addr.sa_data[i]);
			}
			else
			{
				printf("%d.", sock_addr.sa_data[i]);
			}

		}
		struct sockets *s;
		s = malloc(sizeof(struct sockets));
		if (s == NULL) {
			warn("malloc failed.\n");
			return 0;
		}
		s->local = 0;
		s->in = fdopen(conn, "r");
		s->out = fdopen(conn, "w");
		setlinebuf(s->in);
		setlinebuf(s->out);
		return s;
	}
}
