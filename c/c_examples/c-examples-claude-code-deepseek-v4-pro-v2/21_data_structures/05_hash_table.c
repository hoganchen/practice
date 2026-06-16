/**
 * ============================================================================
 * 知识主题：哈希表 —— 拉链法（Separate Chaining）
 *
 * 核心概念：
 *   1. 哈希表（Hash Table）是一种键值对（Key-Value）存储结构
 *   2. 通过哈希函数将键映射到数组的某个索引位置
 *   3. 理想情况下，查找/插入/删除的时间复杂度为 O(1)
 *
 * 哈希冲突与拉链法：
 *   当不同的键通过哈希函数映射到同一个索引时，发生"哈希冲突"
 *   拉链法（Separate Chaining）在每个数组槽位维护一个链表
 *   多个冲突的键值对存储在同一个链表中
 *
 * 哈希函数：
 *   本示例使用 DJB2 算法，由 Daniel J. Bernstein 设计
 *   具有较好的分布性和较低的碰撞率
 *
 * 动态扩容：
 *   当负载因子（元素个数 / 数组大小）超过阈值时，
 *   自动将数组翻倍并重新哈希（rehash）所有元素
 *
 * 编译：gcc 05_hash_table.c -o 05_hash_table.exe -std=c11 -Wall
 * 运行：.\05_hash_table.exe
 * ============================================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

/* ========================== 常量定义 ========================== */

#define INITIAL_CAPACITY  16   /* 哈希表初始容量 */
#define LOAD_FACTOR_THRESHOLD  0.75f  /* 负载因子阈值，超过则扩容 */

/* ========================== 结构体定义 ========================== */

/**
 * 键值对节点（链表节点）
 * 每个节点存储一个键值对，并指向链表中的下一个节点
 * 当多个键映射到同一个槽位时，它们以链表形式串联起来
 */
typedef struct KeyValuePair {
    char *key;                    /* 键（字符串） */
    int value;                    /* 值（整型） */
    struct KeyValuePair *next;    /* 指向链表中下一个节点的指针 */
} KeyValuePair;

/**
 * 哈希表结构体
 * buckets   - 指向桶数组的指针，每个桶是一个链表的头节点指针
 * capacity  - 桶数组的当前大小（即哈希表的槽位数）
 * size      - 哈希表中当前存储的键值对数量
 */
typedef struct {
    KeyValuePair **buckets;  /* 桶数组，每个元素是指向链表头节点的指针 */
    int capacity;            /* 桶数组容量（槽位数） */
    int size;                /* 已存储的键值对数量 */
} HashTable;

/* ========================== 哈希函数 ========================== */

/**
 * DJB2 哈希函数
 * 由 Daniel J. Bernstein 设计，是一种广泛使用的字符串哈希算法
 * 算法特点：
 *   - 使用质数 5381 作为初始哈希值
 *   - 每次迭代：hash = hash * 33 + c
 *   - 33 是一个经验上分布较好的乘数
 *
 * 参数 str：要计算哈希值的字符串
 * 返回值：无符号长整型哈希值（需对容量取模后使用）
 */
unsigned long hashDJB2(const char *str) {
    unsigned long hash = 5381;  /* 经典初始值 5381 */
    int c;

    /* 逐字符计算哈希值 */
    while ((c = *str++)) {
        /* hash * 33 + c，使用位运算优化 */
        hash = ((hash << 5) + hash) + c;  /* hash * 33 + c */
    }

    return hash;
}

/* ========================== 内部辅助函数 ========================== */

/**
 * 计算键对应的桶索引
 * 功能：通过哈希函数计算键在桶数组中的位置
 * 参数 key：键字符串
 * 参数 capacity：桶数组容量
 * 返回值：0 到 capacity-1 之间的索引值
 */
int getBucketIndex(const char *key, int capacity) {
    /* 先计算哈希值，再对容量取模得到桶索引 */
    return (int)(hashDJB2(key) % (unsigned long)capacity);
}

/**
 * 复制字符串（内部辅助）
 * 功能：分配内存并复制字符串
 * 参数 str：要复制的字符串
 * 返回值：新分配的字符串副本
 */
char* strDuplicate(const char *str) {
    size_t len = strlen(str) + 1;  /* +1 存储结束符 '\0' */
    char *copy = (char*)malloc(len);

    if (copy != NULL) {
        memcpy(copy, str, len);  /* 复制字符串内容 */
    }

    return copy;
}

/* ========================== 核心操作函数 ========================== */

/* 前向声明：resizeTable 在 insert 之后定义，需要先声明 */
void resizeTable(HashTable *table);

/**
 * 创建哈希表
 * 功能：分配内存并初始化哈希表
 * 参数 capacity：初始桶数组容量
 * 返回值：指向新创建的哈希表的指针
 */
HashTable* createHashTable(int capacity) {
    /* 分配哈希表结构体内存 */
    HashTable *table = (HashTable*)malloc(sizeof(HashTable));
    if (table == NULL) {
        printf("错误：哈希表内存分配失败！\n");
        return NULL;
    }

    /* 初始化容量和元素个数 */
    table->capacity = capacity;
    table->size = 0;

    /* 分配桶数组内存（数组元素是指向链表头节点的指针） */
    table->buckets = (KeyValuePair**)calloc((size_t)capacity, sizeof(KeyValuePair*));
    if (table->buckets == NULL) {
        printf("错误：桶数组内存分配失败！\n");
        free(table);
        return NULL;
    }

    return table;
}

/**
 * 创建键值对节点
 * 功能：分配内存并初始化一个新的键值对节点
 *
 * 参数 key：键字符串
 * 参数 value：整型值
 * 返回值：指向新创建的节点的指针
 */
KeyValuePair* createPair(const char *key, int value) {
    /* 分配节点内存 */
    KeyValuePair *pair = (KeyValuePair*)malloc(sizeof(KeyValuePair));
    if (pair == NULL) {
        printf("错误：节点内存分配失败！\n");
        return NULL;
    }

    /* 复制键字符串（避免外部指针变化影响内部数据） */
    pair->key = strDuplicate(key);
    if (pair->key == NULL) {
        free(pair);
        return NULL;
    }

    pair->value = value;
    pair->next = NULL;  /* 新节点暂时没有后继 */

    return pair;
}

/**
 * 插入键值对
 * 功能：向哈希表中插入一个键值对
 *       如果键已存在，更新其值；不存在则新建节点
 *
 * 参数 table：哈希表指针
 * 参数 key：键字符串
 * 参数 value：对应的值
 *
 * 说明：插入前检查负载因子，超过阈值自动扩容
 */
void insert(HashTable *table, const char *key, int value) {
    /* ---- 检查是否需要扩容 ---- */
    /*
     * 负载因子 = 元素个数 / 桶数组大小
     * 负载因子越高，冲突概率越大，性能越差
     * 当负载因子超过阈值时，将桶数组翻倍以减少冲突
     */
    float loadFactor = (float)table->size / (float)table->capacity;
    if (loadFactor >= LOAD_FACTOR_THRESHOLD) {
        printf("负载因子 %.2f 超过阈值 %.2f，触发扩容...\n",
               loadFactor, LOAD_FACTOR_THRESHOLD);
        resizeTable(table);
    }

    /* ---- 计算桶索引 ---- */
    int index = getBucketIndex(key, table->capacity);
    printf("  插入 [%s -> %d] 到桶 [%d]\n", key, value, index);

    /* ---- 查找是否已存在该键 ---- */
    KeyValuePair *current = table->buckets[index];

    while (current != NULL) {
        if (strcmp(current->key, key) == 0) {
            /* 键已存在，更新值 */
            printf("  键 [%s] 已存在，更新值：%d -> %d\n",
                   key, current->value, value);
            current->value = value;
            return;
        }
        current = current->next;
    }

    /* ---- 键不存在，创建新节点插入到链表头部 ---- */
    KeyValuePair *newPair = createPair(key, value);
    if (newPair == NULL) {
        return;  /* 内存分配失败 */
    }

    /* 头插法：新节点插入到链表头部 */
    newPair->next = table->buckets[index];
    table->buckets[index] = newPair;
    table->size++;  /* 元素计数加 1 */
}

/**
 * 查找键对应的值
 * 功能：根据键在哈希表中查找对应的值
 * 参数 table：哈希表指针
 * 参数 key：要查找的键
 * 返回值：如果找到返回 true，并通过 value 参数返回对应的值
 *         如果没找到返回 false，value 的值不变
 */
bool search(HashTable *table, const char *key, int *value) {
    /* 计算桶索引，定位到对应的链表 */
    int index = getBucketIndex(key, table->capacity);

    /* 遍历该桶对应的链表 */
    KeyValuePair *current = table->buckets[index];

    while (current != NULL) {
        if (strcmp(current->key, key) == 0) {
            /* 找到了匹配的键 */
            *value = current->value;  /* 通过指针参数返回值 */
            return true;
        }
        current = current->next;  /* 继续遍历下一个节点 */
    }

    /* 遍历完整个链表没有找到 */
    return false;
}

/**
 * 删除键值对
 * 功能：从哈希表中删除指定键对应的键值对
 * 参数 table：哈希表指针
 * 参数 key：要删除的键
 * 返回值：成功删除返回 true，键不存在返回 false
 *
 * 说明：需要处理链表删除的两种情况：
 *   1. 删除的是头节点
 *   2. 删除的是中间或尾节点
 */
bool delete(HashTable *table, const char *key) {
    int index = getBucketIndex(key, table->capacity);
    KeyValuePair *current = table->buckets[index];
    KeyValuePair *prev = NULL;  /* 记录前一个节点，用于链表删除 */

    /* 遍历链表查找要删除的节点 */
    while (current != NULL) {
        if (strcmp(current->key, key) == 0) {
            /* 找到要删除的节点 */

            if (prev == NULL) {
                /* 情况1：要删除的是头节点 */
                table->buckets[index] = current->next;
            } else {
                /* 情况2：要删除的是中间或尾节点 */
                prev->next = current->next;
            }

            /* 释放节点内存 */
            printf("  删除键 [%s]，值 [%d]\n", current->key, current->value);
            free(current->key);   /* 释放键字符串 */
            free(current);        /* 释放节点本身 */
            table->size--;        /* 元素计数减 1 */
            return true;
        }

        prev = current;           /* 更新前驱节点指针 */
        current = current->next;  /* 移动到下一个节点 */
    }

    /* 键不存在 */
    return false;
}

/* ========================== 扩容操作 ========================== */

/**
 * 哈希表扩容
 * 功能：当负载因子过高时，将桶数组翻倍并重新哈希所有元素
 *
 * 重新哈希（Rehash）说明：
 *   扩容后，每个键的桶索引会改变（因为容量变了）
 *   必须重新计算所有键值对的哈希值，并将其插入到新位置
 *   这是哈希表扩容中最耗时的操作，但保证了后续操作的高效
 */
void resizeTable(HashTable *table) {
    int oldCapacity = table->capacity;
    KeyValuePair **oldBuckets = table->buckets;

    /* 容量翻倍 */
    table->capacity = oldCapacity * 2;
    printf("  扩容：%d -> %d\n", oldCapacity, table->capacity);

    /* 分配新的桶数组 */
    table->buckets = (KeyValuePair**)calloc(
        (size_t)table->capacity, sizeof(KeyValuePair*));
    if (table->buckets == NULL) {
        printf("错误：扩容时内存分配失败！\n");
        /* 恢复旧状态 */
        table->buckets = oldBuckets;
        table->capacity = oldCapacity;
        return;
    }

    /* 重置元素计数（重新插入时会重新计数） */
    table->size = 0;

    /* ---- 重新哈希（Rehash）：遍历旧桶数组中的所有链表 ---- */
    printf("  开始重新哈希 %d 个键值对...\n", oldCapacity);

    for (int i = 0; i < oldCapacity; i++) {
        KeyValuePair *current = oldBuckets[i];

        /* 遍历当前桶的链表 */
        while (current != NULL) {
            KeyValuePair *next = current->next;  /* 保存下一个节点 */

            /* 重新计算新索引并插入到新桶中 */
            int newIndex = getBucketIndex(current->key, table->capacity);
            current->next = table->buckets[newIndex];
            table->buckets[newIndex] = current;
            table->size++;

            current = next;  /* 处理下一个节点 */
        }
    }

    /* 释放旧的桶数组（注意：节点本身已被迁移，不能释放） */
    free(oldBuckets);

    printf("  重新哈希完成，新容量：%d，当前元素数：%d\n",
           table->capacity, table->size);
}

/* ========================== 辅助操作函数 ========================== */

/**
 * 打印哈希表状态
 * 功能：显示哈希表中所有键值对的分布情况
 * 参数 table：哈希表指针
 */
void printHashTable(HashTable *table) {
    printf("\n========== 哈希表状态 ==========\n");
    printf("容量：%d\n", table->capacity);
    printf("元素数：%d\n", table->size);
    printf("负载因子：%.2f\n",
           (float)table->size / (float)table->capacity);
    printf("-------------------------------\n");

    /* 遍历所有桶 */
    for (int i = 0; i < table->capacity; i++) {
        KeyValuePair *current = table->buckets[i];

        if (current != NULL) {
            /* 当前桶不为空，打印链表中的每个节点 */
            printf("  桶[%3d]：", i);

            while (current != NULL) {
                printf("(%s: %d)", current->key, current->value);
                if (current->next != NULL) {
                    printf(" -> ");  /* 链表箭头指示 */
                }
                current = current->next;
            }
            printf("\n");
        }
    }
    printf("===============================\n\n");
}

/**
 * 释放哈希表
 * 功能：释放哈希表中所有节点和桶数组的内存
 * 参数 table：哈希表指针
 *
 * 注意！：必须先释放所有链表节点，再释放桶数组，最后释放哈希表结构体
 */
void freeHashTable(HashTable *table) {
    if (table == NULL) {
        return;
    }

    /* 遍历所有桶，释放每个链表中的所有节点 */
    for (int i = 0; i < table->capacity; i++) {
        KeyValuePair *current = table->buckets[i];

        while (current != NULL) {
            KeyValuePair *temp = current;  /* 保存当前节点 */
            current = current->next;       /* 先移动到下一个节点 */

            free(temp->key);   /* 释放键字符串 */
            free(temp);        /* 释放节点本身 */
        }
    }

    /* 释放桶数组 */
    free(table->buckets);

    /* 释放哈希表结构体 */
    free(table);
}

/* ========================== 主函数 ========================== */

int main(void) {
    printf("============================================================\n");
    printf("  哈希表（拉链法）演示程序\n");
    printf("============================================================\n\n");

    /* ---- 创建哈希表 ---- */
    printf("【1】创建哈希表（初始容量：%d）\n", INITIAL_CAPACITY);
    HashTable *table = createHashTable(INITIAL_CAPACITY);

    if (table == NULL) {
        printf("创建哈希表失败，程序退出。\n");
        return 1;
    }

    /* ---- 插入键值对 ---- */
    printf("\n【2】插入键值对：\n");

    insert(table, "apple",  100);
    insert(table, "banana", 200);
    insert(table, "cherry", 300);
    insert(table, "date",   400);
    insert(table, "elderberry", 500);

    /* 故意插入一些可能冲突的键 */
    insert(table, "cat", 150);    /* 可能与某个键冲突 */
    insert(table, "car", 250);    /* 可能与 cat 或其它键冲突 */
    insert(table, "dog", 350);

    /* 更新已有键的值 */
    printf("\n【3】更新已有键的值：\n");
    insert(table, "apple", 101);  /* 更新 apple 的值 100 -> 101 */

    /* 插入更多数据触发扩容 */
    printf("\n【4】插入更多数据（可能触发扩容，因为负载因子会升高）：\n");
    insert(table, "fish",   50);
    insert(table, "goat",   60);
    insert(table, "horse",  70);
    insert(table, "iguana", 80);
    insert(table, "jackal", 90);

    /* 打印当前状态 */
    printHashTable(table);

    /* ---- 查找操作 ---- */
    printf("【5】查找操作：\n");

    const char *searchKeys[] = {"apple", "cherry", "not_exist", "dog"};
    int searchCount = sizeof(searchKeys) / sizeof(searchKeys[0]);

    for (int i = 0; i < searchCount; i++) {
        int val = 0;
        bool found = search(table, searchKeys[i], &val);

        if (found) {
            printf("  找到 [%s] -> 值 = %d\n", searchKeys[i], val);
        } else {
            printf("  未找到键 [%s]\n", searchKeys[i]);
        }
    }
    printf("\n");

    /* ---- 删除操作 ---- */
    printf("【6】删除操作：\n");

    const char *deleteKeys[] = {"banana", "cat", "not_exist"};
    int deleteCount = sizeof(deleteKeys) / sizeof(deleteKeys[0]);

    for (int i = 0; i < deleteCount; i++) {
        bool deleted = delete(table, deleteKeys[i]);

        if (!deleted) {
            printf("  键 [%s] 不存在，删除失败\n", deleteKeys[i]);
        }
    }

    /* 打印删除后的状态 */
    printHashTable(table);

    /* ---- 最终验证 ---- */
    printf("【7】最终验证：\n");
    printf("  尝试查找被删除的键 [banana]...\n");

    int val = 0;
    if (!search(table, "banana", &val)) {
        printf("  确认：banana 已被成功删除 ✓\n");
    }

    /* ---- 释放内存 ---- */
    printf("\n【8】释放哈希表内存...\n");
    freeHashTable(table);
    printf("  内存释放完成，程序结束。\n");

    return 0;
}
