// ============================================================
// Rust 知识点：VecDeque（双端队列）和 LinkedList（链表）
// 编译：rustc 006_vecdeque_linkedlist.rs && .\006_vecdeque_linkedlist.exe
// ============================================================

use std::collections::{LinkedList, VecDeque};

fn main() {
    // ========== VecDeque<T> ==========
    // 双端队列，两端都可以高效插入/删除
    // 内部使用环形缓冲区（ring buffer）

    let mut deque: VecDeque<i32> = VecDeque::new();

    // 两端添加
    deque.push_back(3);
    deque.push_back(4);
    deque.push_front(2);
    deque.push_front(1);

    println!("VecDeque: {:?}", deque);

    // 两端移除
    let front = deque.pop_front().unwrap(); // 1
    let back = deque.pop_back().unwrap();   // 4
    println!("pop_front: {}, pop_back: {}", front, back);
    println!("剩余: {:?}", deque);

    // ---- VecDeque 常用方法 ----
    let mut dq = VecDeque::from([1, 2, 3, 4, 5]);

    // 查看两端
    println!("front: {:?}", dq.front()); // Some(1)
    println!("back: {:?}", dq.back());   // Some(5)

    // 旋转
    dq.rotate_left(2);
    println!("rotate_left(2): {:?}", dq);
    dq.rotate_right(1);
    println!("rotate_right(1): {:?}", dq);

    // 保留/移除条件元素
    dq.retain(|&x| x > 2);
    println!("retain >2: {:?}", dq);

    // 将 VecDeque 转为 Vec
    let vec: Vec<i32> = Vec::from(dq);
    println!("转为 Vec: {:?}", vec);

    // ---- VecDeque 性能特点 ----
    // 适用于：队列、滑动窗口、回文检查
    fn is_palindrome<T: Eq>(deque: &mut VecDeque<T>) -> bool {
        while deque.len() > 1 {
            if deque.pop_front() != deque.pop_back() {
                return false;
            }
        }
        true
    }

    let mut test = VecDeque::from([1, 2, 3, 2, 1]);
    println!("回文检查 [1,2,3,2,1]: {}", is_palindrome(&mut test));

    // ========== LinkedList<T> ==========
    // 双向链表，节点在堆上分散存储
    // 大多数场景下 VecDeque 性能更好
    // LinkedList 的优势：在中间进行大量插入/删除

    let mut list1: LinkedList<i32> = LinkedList::new();
    list1.push_back(1);
    list1.push_back(2);
    list1.push_back(3);

    let mut list2: LinkedList<i32> = LinkedList::new();
    list2.push_back(4);
    list2.push_back(5);

    println!("\nLinkedList1: {:?}", list1);
    println!("LinkedList2: {:?}", list2);

    // split_off：在指定位置分裂
    let mut list = LinkedList::from([1, 2, 3, 4, 5]);
    let mut suffix = list.split_off(3);
    println!("\nsplit_off(3): list={:?}, suffix={:?}", list, suffix);

    // append：合并链表
    list.append(&mut suffix);
    println!("append 后: {:?}", list);

    // front/back
    println!("front: {:?}, back: {:?}", list.front(), list.back());

    // ---- 三种队列性能对比 ----
    println!("\n性能特点：");
    println!("VecDeque: 两端 O(1)，中间 O(n)，缓存友好");
    println!("LinkedList: 已知位置插入 O(1)，缓存不友好");
    println!("Vec: 末尾 O(1)，前端 O(n)");

    // ---- 使用建议 ----
    println!("\n使用场景：");
    println!("- 需要队列/双端队列: VecDeque");
    println!("- 需要频繁在中间插入/删除: LinkedList");
    println!("- 默认使用: VecDeque（通常比 LinkedList 快）");
}
