// ============================================================
// Rust 知识点：Atomic 原子类型 —— 无锁并发编程
// 编译：rustc 005_atomic_types.rs && .\005_atomic_types.exe
// ============================================================

use std::sync::atomic::{
    AtomicBool, AtomicI32, AtomicI64, AtomicU64, Ordering,
};
use std::thread;
use std::time::Duration;

fn main() {
    // ========== 基本原子操作 ==========
    // AtomicBool
    let flag = AtomicBool::new(false);
    flag.store(true, Ordering::SeqCst);
    let val = flag.load(Ordering::SeqCst);
    println!("AtomicBool: {}", val);

    // AtomicI32
    let counter = AtomicI32::new(0);

    // fetch_add：原子加
    let prev = counter.fetch_add(5, Ordering::SeqCst);
    println!("fetch_add 前: {}, 后: {}", prev, counter.load(Ordering::SeqCst));

    // fetch_sub：原子减
    counter.fetch_sub(2, Ordering::SeqCst);
    println!("fetch_sub 后: {}", counter.load(Ordering::SeqCst));

    // ---- 内存顺序（Ordering） ----
    // SeqCst（顺序一致性）：最强保证，最安全但最慢
    // Acquire：之后的读写不能重排到该操作之前
    // Release：之前的读写不能重排到该操作之后
    // AcqRel：Acquire + Release 的组合
    // Relaxed：仅保证原子性，不保证顺序

    // ========== compare_exchange —— CAS 操作 ==========
    let atomic = AtomicI32::new(10);

    // CAS：如果当前值是 10，则更新为 20
    let result = atomic.compare_exchange(10, 20, Ordering::SeqCst, Ordering::SeqCst);
    match result {
        Ok(old) => println!("CAS 成功，旧值: {}", old),
        Err(old) => println!("CAS 失败，当前值: {}", old),
    }

    // 再次 CAS（当前值已是 20，不再匹配 10）
    let result = atomic.compare_exchange(10, 30, Ordering::SeqCst, Ordering::SeqCst);
    match result {
        Ok(old) => println!("CAS 成功"),
        Err(old) => println!("CAS 失败，当前值: {}", old),
    }

    // ========== fetch_update（CAS 循环） ==========
    let atomic = AtomicI32::new(5);
    let result = atomic.fetch_update(Ordering::SeqCst, Ordering::SeqCst, |x| {
        if x > 0 {
            Some(x * 2) // 更新为 2 倍
        } else {
            None // 不更新
        }
    });

    match result {
        Ok(old_value) => println!("fetch_update 旧值: {}, 新值: {}",
            old_value, atomic.load(Ordering::SeqCst)),
        Err(_) => println!("fetch_update 未更新"),
    }

    // ========== 线程间共享原子变量 ==========
    use std::sync::Arc;

    let shared_counter = Arc::new(AtomicI64::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&shared_counter);
        let handle = thread::spawn(move || {
            for _ in 0..1000 {
                counter.fetch_add(1, Ordering::Relaxed);
            }
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("10 个线程各加 1000 次: {}", shared_counter.load(Ordering::SeqCst));

    // ========== 自旋锁（spinlock）示例 ==========
    let lock = Arc::new(AtomicBool::new(false)); // false = 未锁定
    let lock_clone = Arc::clone(&lock);

    let handle = thread::spawn(move || {
        // 忙等待获取锁
        while lock_clone
            .compare_exchange(false, true, Ordering::Acquire, Ordering::Relaxed)
            .is_err()
        {
            // 自旋等待
            thread::yield_now();
        }
        println!("子线程获取了锁");
        thread::sleep(Duration::from_millis(50));
        lock_clone.store(false, Ordering::Release);
        println!("子线程释放了锁");
    });

    // 主线程获取锁
    while lock
        .compare_exchange(false, true, Ordering::Acquire, Ordering::Relaxed)
        .is_err()
    {
        thread::yield_now();
    }
    println!("主线程获取了锁");
    lock.store(false, Ordering::Release);

    handle.join().unwrap();
}
