// ============================================================
// Rust 知识点：BinaryHeap —— 二叉堆（优先队列）
// 默认是最大堆（最大值在堆顶）
// 编译：rustc 005_binaryheap.rs && .\005_binaryheap.exe
// ============================================================

use std::collections::BinaryHeap;

// ---- 自定义类型放入 BinaryHeap ----
// 需要实现 Ord trait（或使用 std::cmp::Reverse）
#[derive(Debug, Eq, PartialEq)]
struct Task {
    priority: u32,
    name: String,
}

// 实现排序：高优先级在前
impl Ord for Task {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.priority.cmp(&other.priority)
    }
}

impl PartialOrd for Task {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

fn main() {
    // ---- 基本使用（最大堆） ----
    let mut heap = BinaryHeap::new();

    heap.push(5);
    heap.push(10);
    heap.push(3);
    heap.push(8);

    println!("堆长度: {}", heap.len());
    println!("是否为空: {}", heap.is_empty());

    // peek：查看最大值（不移除）
    println!("最大值: {:?}", heap.peek()); // Some(10)

    // pop：取出最大值
    println!("\n逐个取出（降序）:");
    while let Some(val) = heap.pop() {
        print!("{} ", val);
    }
    println!();

    // ---- 从 Vec 构建堆 ----
    let numbers = vec![1, 5, 2, 8, 3, 7, 4, 6];
    let heap_from_vec: BinaryHeap<i32> = numbers.into_iter().collect();
    println!("从 Vec 构建: {:?}", heap_from_vec.into_sorted_vec());

    // ---- 最小堆（使用 Reverse） ----
    use std::cmp::Reverse;

    let mut min_heap: BinaryHeap<Reverse<i32>> = BinaryHeap::new();
    min_heap.push(Reverse(5));
    min_heap.push(Reverse(1));
    min_heap.push(Reverse(8));
    min_heap.push(Reverse(3));

    println!("\n最小堆（升序）:");
    while let Some(Reverse(val)) = min_heap.pop() {
        print!("{} ", val);
    }
    println!();

    // ---- 自定义类型 ----
    let mut task_queue = BinaryHeap::new();

    task_queue.push(Task {
        priority: 1,
        name: String::from("低优先级任务"),
    });
    task_queue.push(Task {
        priority: 10,
        name: String::from("高优先级任务"),
    });
    task_queue.push(Task {
        priority: 5,
        name: String::from("中优先级任务"),
    });

    println!("\n任务队列（按优先级）:");
    while let Some(task) = task_queue.pop() {
        println!("  优先级 {}: {}", task.priority, task.name);
    }

    // ---- BinaryHeap 的容量管理 ----
    let mut heap = BinaryHeap::with_capacity(10);
    println!("\n容量: {}", heap.capacity());

    for i in 0..8 {
        heap.push(i);
    }
    println!("push 8 个后容量: {}", heap.capacity());
    heap.shrink_to_fit();
    println!("shrink_to_fit 后容量: {}", heap.capacity());

    // ---- into_sorted_vec ----
    let mut heap = BinaryHeap::from([3, 1, 4, 1, 5, 9, 2, 6]);
    let sorted = heap.into_sorted_vec();
    println!("\nsorted vec (asc): {:?}", sorted);
}
