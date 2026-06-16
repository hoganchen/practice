/**
 * ============================================================
 *  知识点: 自引用结构体 (Self-Referential Structures)
 *         —— 链表节点的实现
 *
 *  编译指令: gcc 04_self_referential_structs.c -o 04_self_referential_structs.exe -std=c11 -Wall
 *  运行指令: ./04_self_referential_structs.exe
 *
 *  本文件演示:
 *    1. 结构体中包含指向同一结构体类型的指针（自引用）
 *    2. 前向声明 (forward declaration) 与 typedef
 *    3. 简单单向链表的创建、遍历与释放
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>   /* 提供 malloc, free */

/*------------------------------------------------------------------
 *  自引用结构体: 链表节点 (Node)
 *
 *  结构体中包含一个指向自身类型的指针 next,
 *  这就是"自引用结构体" —— 结构体包含指向同类型结构体的指针。
 *
 *  注意: 由于 struct Node 尚未定义完成, 不能直接写 typedef 别名。
 *  需要使用前向声明技巧。
 *
 *  方式一: 先给 struct 起别名, 再用别名声明指针成员
 *------------------------------------------------------------------*/

/* 前向声明: 告诉编译器 struct Node 是一个结构体类型 */
typedef struct Node Node;

/* 现在定义 struct Node, 可以使用 Node* 了 */
struct Node {
    int   data;    /* 节点存储的数据 */
    Node *next;    /* 指向下一个节点的指针 (自引用!) */
};

/*------------------------------------------------------------------
 *  方式二: 也可以将定义和 typedef 合并 (C11 标准允许)
 *
 *  typedef struct Node {
 *      int   data;
 *      struct Node *next;  // 必须写 struct Node, 因为 typedef 别名尚未生效
 *  } Node;
 *
 *  注意: 在结构体内部, typedef 的别名还未生效, 必须用 struct Node
 *        这就是我们使用方式一的原因。
 *------------------------------------------------------------------*/

/*------------------------------------------------------------------
 *  链表操作函数声明
 *------------------------------------------------------------------*/

/* 在链表头部插入一个新节点, 返回新头节点指针 */
Node* listPushFront(Node *head, int value);

/* 在链表尾部插入一个新节点, 返回头节点指针 */
Node* listPushBack(Node *head, int value);

/* 遍历打印整个链表 */
void listPrint(const Node *head);

/* 释放整个链表的内存 */
void listFree(Node *head);

/* 获取链表长度 */
int listLength(const Node *head);

/* 查找第一个包含指定值的节点, 返回节点指针, 未找到返回 NULL */
Node* listFind(Node *head, int value);

/* 删除第一个包含指定值的节点, 返回新的头节点 */
Node* listDelete(Node *head, int value);


/*------------------------------------------------------------------
 *  主函数
 *------------------------------------------------------------------*/
int main(void)
{
    printf("========================================\n");
    printf("  自引用结构体 —— 单向链表\n");
    printf("========================================\n\n");

    /*--------------------------------------------------------------
     *  1. 手动创建链表: 逐个分配节点并链接
     *--------------------------------------------------------------*/
    printf("--- 手动创建链表 ---\n");

    /* 创建第一个节点 */
    Node *node1 = (Node*)malloc(sizeof(Node));
    if (node1 == NULL) {   /* 检查内存分配是否成功 */
        printf("内存分配失败!\n");
        return 1;
    }
    node1->data = 10;
    node1->next = NULL;    /* 最后一个节点的 next 置为 NULL */

    /* 创建第二个节点 */
    Node *node2 = (Node*)malloc(sizeof(Node));
    if (node2 == NULL) {
        printf("内存分配失败!\n");
        free(node1);
        return 1;
    }
    node2->data = 20;
    node2->next = NULL;

    /* 创建第三个节点 */
    Node *node3 = (Node*)malloc(sizeof(Node));
    if (node3 == NULL) {
        printf("内存分配失败!\n");
        free(node1);
        free(node2);
        return 1;
    }
    node3->data = 30;
    node3->next = NULL;

    /* 链接节点: node1 -> node2 -> node3 -> NULL */
    node1->next = node2;
    node2->next = node3;

    /* head 指向第一个节点 */
    Node *head = node1;

    printf("手动创建的链表: ");
    listPrint(head);
    printf("链表长度: %d\n\n", listLength(head));

    /*--------------------------------------------------------------
     *  2. 使用函数创建链表: 头部插入
     *--------------------------------------------------------------*/
    printf("--- 使用 listPushFront 头部插入 ---\n");

    Node *head2 = NULL;   /* 初始为空链表 */

    head2 = listPushFront(head2, 30);
    head2 = listPushFront(head2, 20);
    head2 = listPushFront(head2, 10);

    printf("链表 (头插法, 顺序: 10->20->30): ");
    listPrint(head2);
    printf("\n");

    /*--------------------------------------------------------------
     *  3. 使用函数创建链表: 尾部插入
     *--------------------------------------------------------------*/
    printf("--- 使用 listPushBack 尾部插入 ---\n");

    Node *head3 = NULL;   /* 初始为空链表 */

    head3 = listPushBack(head3, 10);
    head3 = listPushBack(head3, 20);
    head3 = listPushBack(head3, 30);

    printf("链表 (尾插法, 顺序: 10->20->30): ");
    listPrint(head3);
    printf("\n");

    /*--------------------------------------------------------------
     *  4. 查找节点
     *--------------------------------------------------------------*/
    printf("--- 查找节点 ---\n");
    Node *found = listFind(head3, 20);
    if (found != NULL) {
        printf("找到节点: data = %d\n", found->data);
    } else {
        printf("未找到节点\n");
    }

    found = listFind(head3, 99);
    if (found != NULL) {
        printf("找到节点: data = %d\n", found->data);
    } else {
        printf("未找到值 99 的节点\n");
    }
    printf("\n");

    /*--------------------------------------------------------------
     *  5. 删除节点
     *--------------------------------------------------------------*/
    printf("--- 删除节点 ---\n");
    printf("删除前: ");
    listPrint(head3);

    head3 = listDelete(head3, 20);   /* 删除中间节点 */
    printf("删除 20 后: ");
    listPrint(head3);

    head3 = listDelete(head3, 10);   /* 删除头节点 */
    printf("删除 10 后: ");
    listPrint(head3);

    head3 = listDelete(head3, 30);   /* 删除尾节点 */
    printf("删除 30 后: ");
    listPrint(head3);
    printf("\n");

    /*--------------------------------------------------------------
     *  6. 释放链表内存
     *--------------------------------------------------------------*/
    printf("--- 释放链表内存 ---\n");
    listFree(head);
    listFree(head2);
    /* head3 已在删除过程中释放完毕 */
    printf("所有链表内存已释放\n");

    return 0;
}


/* =================================================================
 *  链表操作函数实现
 * ================================================================= */

/*------------------------------------------------------------------
 *  listPushFront: 在链表头部插入新节点
 *
 *  步骤:
 *    1. 为新节点分配内存
 *    2. 新节点的 next 指向原来的头节点
 *    3. 返回新节点作为新的头节点
 *
 *  时间复杂度: O(1)
 *------------------------------------------------------------------*/
Node* listPushFront(Node *head, int value)
{
    Node *newNode = (Node*)malloc(sizeof(Node));
    if (newNode == NULL) {
        printf("错误: 内存分配失败\n");
        return head;  /* 返回原链表 */
    }

    newNode->data = value;   /* 设置数据 */
    newNode->next = head;    /* 新节点指向原头节点 */

    return newNode;          /* 新节点成为新的头节点 */
}

/*------------------------------------------------------------------
 *  listPushBack: 在链表尾部插入新节点
 *
 *  步骤:
 *    1. 为新节点分配内存, next 置为 NULL
 *    2. 如果链表为空, 新节点就是头节点
 *    3. 否则遍历到最后一个节点, 将其 next 指向新节点
 *
 *  时间复杂度: O(n)
 *------------------------------------------------------------------*/
Node* listPushBack(Node *head, int value)
{
    Node *newNode = (Node*)malloc(sizeof(Node));
    if (newNode == NULL) {
        printf("错误: 内存分配失败\n");
        return head;
    }

    newNode->data = value;
    newNode->next = NULL;

    /* 如果链表为空, 新节点即为头节点 */
    if (head == NULL) {
        return newNode;
    }

    /* 遍历到最后一个节点 */
    Node *current = head;
    while (current->next != NULL) {
        current = current->next;
    }

    /* 将最后一个节点的 next 指向新节点 */
    current->next = newNode;

    return head;  /* 头节点不变 */
}

/*------------------------------------------------------------------
 *  listPrint: 遍历打印整个链表
 *
 *  从 head 开始, 沿着 next 指针逐个访问节点,
 *  直到遇到 NULL (链表末尾)
 *------------------------------------------------------------------*/
void listPrint(const Node *head)
{
    const Node *current = head;

    while (current != NULL) {
        printf("%d", current->data);

        if (current->next != NULL) {
            printf(" -> ");   /* 中间节点用箭头连接 */
        } else {
            printf(" -> NULL"); /* 最后一个节点指向 NULL */
        }

        current = current->next;  /* 移动到下一个节点 */
    }
    printf("\n");
}

/*------------------------------------------------------------------
 *  listFree: 释放整个链表占用的内存
 *
 *  必须逐个节点释放, 不能只释放头节点。
 *  注意: 在释放当前节点前, 要先保存下一个节点的指针。
 *------------------------------------------------------------------*/
void listFree(Node *head)
{
    Node *current = head;

    while (current != NULL) {
        Node *next = current->next;  /* 先保存下一个节点的指针 */
        free(current);               /* 释放当前节点 */
        current = next;              /* 移动到下一个节点 */
    }
}

/*------------------------------------------------------------------
 *  listLength: 返回链表长度
 *------------------------------------------------------------------*/
int listLength(const Node *head)
{
    int count = 0;
    const Node *current = head;

    while (current != NULL) {
        count++;
        current = current->next;
    }

    return count;
}

/*------------------------------------------------------------------
 *  listFind: 查找第一个包含指定值的节点
 *
 *  遍历链表, 比较每个节点的 data,
 *  找到则返回节点指针, 未找到返回 NULL
 *------------------------------------------------------------------*/
Node* listFind(Node *head, int value)
{
    Node *current = head;

    while (current != NULL) {
        if (current->data == value) {
            return current;   /* 找到, 返回节点指针 */
        }
        current = current->next;
    }

    return NULL;  /* 未找到 */
}

/*------------------------------------------------------------------
 *  listDelete: 删除第一个包含指定值的节点
 *
 *  需要处理三种情况:
 *    1. 删除头节点 (head 指向下一个节点)
 *    2. 删除中间节点 (前一个节点的 next 跳过当前节点)
 *    3. 删除尾节点 (前一个节点的 next 置为 NULL)
 *    4. 未找到节点 (返回原链表)
 *
 *  返回值: 新的头节点 (可能不变)
 *------------------------------------------------------------------*/
Node* listDelete(Node *head, int value)
{
    if (head == NULL) {
        return NULL;  /* 空链表, 直接返回 */
    }

    /* 如果要删除的是头节点 */
    if (head->data == value) {
        Node *newHead = head->next;  /* 新头节点是原头节点的下一个 */
        free(head);                  /* 释放原头节点 */
        return newHead;
    }

    /* 遍历查找要删除的节点, 并记录前一个节点 */
    Node *current = head;

    while (current->next != NULL && current->next->data != value) {
        current = current->next;
    }

    /* 如果找到了 (current->next != NULL 且 data 匹配) */
    if (current->next != NULL) {
        Node *target = current->next;       /* 待删除的节点 */
        current->next = target->next;       /* 前一个节点跳过目标节点 */
        free(target);                       /* 释放目标节点 */
    }
    /* 如果没找到, 什么也不做 */

    return head;  /* 头节点不变 */
}
