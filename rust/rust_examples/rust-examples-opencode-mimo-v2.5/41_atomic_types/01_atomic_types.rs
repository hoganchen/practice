// ============================================
// 知识点：原子类型
// 难度：高级
// ============================================

// 原子类型提供无锁的线程安全操作
// 位于 std::sync::atomic 模块

use std::sync::atomic::{AtomicBool, AtomicI32, AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    // ==================== 基础原子类型 ====================
    println!("=== 基础原子类型 ===");
    
    let atomic_bool = AtomicBool::new(true);
    let atomic_i32 = AtomicI32::new(42);
    let atomic_usize = AtomicUsize::new(100);
    
    println!("AtomicBool: {}", atomic_bool.load(Ordering::SeqCst));
    println!("AtomicI32: {}", atomic_i32.load(Ordering::SeqCst));
    println!("AtomicUsize: {}", atomic_usize.load(Ordering::SeqCst));
    
    // ==================== 原子操作 ====================
    println!("\n=== 原子操作 ===");
    
    let counter = AtomicI32::new(0);
    
    // store 和 load
    counter.store(10, Ordering::SeqCst);
    println!("存储后: {}", counter.load(Ordering::SeqCst));
    
    // fetch_add
    let old = counter.fetch_add(5, Ordering::SeqCst);
    println!("fetch_add 返回旧值: {}, 新值: {}", old, counter.load(Ordering::SeqCst));
    
    // fetch_sub
    let old = counter.fetch_sub(3, Ordering::SeqCst);
    println!("fetch_sub 返回旧值: {}, 新值: {}", old, counter.load(Ordering::SeqCst));
    
    // ==================== compare_exchange ====================
    println!("\n=== compare_exchange ===");
    
    let value = AtomicI32::new(10);
    
    // 成功的情况
    let result = value.compare_exchange(10, 20, Ordering::SeqCst, Ordering::SeqCst);
    println!("compare_exchange (成功): {:?}", result);
    println!("新值: {}", value.load(Ordering::SeqCst));
    
    // 失败的情况
    let result = value.compare_exchange(10, 30, Ordering::SeqCst, Ordering::SeqCst);
    println!("compare_exchange (失败): {:?}", result);
    println!("值不变: {}", value.load(Ordering::SeqCst));
    
    // ==================== Ordering ====================
    println!("\n=== Ordering ===");
    
    println!("Ordering 类型:");
    println!("  Relaxed: 最弱的顺序，只保证原子性");
    println!("  Acquire: 读取时使用，防止后续操作重排到此之前");
    println!("  Release: 写入时使用，防止之前的操作重排到此之后");
    println!("  AcqRel: 同时具有 Acquire 和 Release 语义");
    println!("  SeqCst: 最强的顺序，全局顺序一致性");
    
    // ==================== 原子布尔 ====================
    println!("\n=== 原子布尔 ===");
    
    let flag = AtomicBool::new(false);
    
    let handle = thread::spawn(move || {
        // 模拟一些工作
        thread::sleep(std::time::Duration::from_millis(100));
        flag.store(true, Ordering::SeqCst);
        println!("子线程设置标志为 true");
    });
    
    // 等待标志被设置
    while !flag.load(Ordering::SeqCst) {
        thread::sleep(std::time::Duration::from_millis(10));
    }
    
    println!("主线程检测到标志为 true");
    handle.join().unwrap();
    
    // ==================== 原子计数器 ====================
    println!("\n=== 原子计数器 ===");
    
    let counter = Arc::new(AtomicUsize::new(0));
    let mut handles = vec![];
    
    for i in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            for _ in 0..1000 {
                counter.fetch_add(1, Ordering::SeqCst);
            }
            println!("线程 {} 完成", i);
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("最终计数: {}", counter.load(Ordering::SeqCst));
    
    // ==================== 原子标志 ====================
    println!("\n=== 原子标志 ===");
    
    let ready = Arc::new(AtomicBool::new(false));
    let data = Arc::new(AtomicI32::new(0));
    
    let ready_clone = Arc::clone(&ready);
    let data_clone = Arc::clone(&data);
    
    // 生产者线程
    let producer = thread::spawn(move || {
        data_clone.store(42, Ordering::SeqCst);
        ready_clone.store(true, Ordering::Release);
        println!("生产者: 数据已准备");
    });
    
    // 消费者线程
    let consumer = thread::spawn(move || {
        while !ready.load(Ordering::Acquire) {
            thread::sleep(std::time::Duration::from_millis(10));
        }
        let value = data.load(Ordering::SeqCst);
        println!("消费者: 收到数据 {}", value);
    });
    
    producer.join().unwrap();
    consumer.join().unwrap();
    
    // ==================== 原子与锁 ====================
    println!("\n=== 原子与锁 ===");
    
    use std::sync::Mutex;
    
    // 使用原子类型代替简单的锁
    let atomic_counter = Arc::new(AtomicI32::new(0));
    let mutex_counter = Arc::new(Mutex::new(0));
    
    let start = std::time::Instant::now();
    let mut handles = vec![];
    
    // 原子计数器
    let counter = Arc::clone(&atomic_counter);
    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..100000 {
                counter.fetch_add(1, Ordering::SeqCst);
            }
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    let atomic_time = start.elapsed();
    println!("原子计数器耗时: {:?}", atomic_time);
    println!("原子计数器值: {}", atomic_counter.load(Ordering::SeqCst));
    
    // Mutex 计数器
    let start = std::time::Instant::now();
    let mut handles = vec![];
    
    for _ in 0..10 {
        let counter = Arc::clone(&mutex_counter);
        handles.push(thread::spawn(move || {
            for _ in 0..100000 {
                let mut num = counter.lock().unwrap();
                *num += 1;
            }
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    let mutex_time = start.elapsed();
    println!("Mutex 计数器耗时: {:?}", mutex_time);
    println!("Mutex 计数器值: {}", *mutex_counter.lock().unwrap());
    
    // ==================== 原子与内存屏障 ====================
    println!("\n=== 原子与内存屏障 ===");
    
    let data = Arc::new(AtomicI32::new(0));
    let flag = Arc::new(AtomicBool::new(false));
    
    let data_clone = Arc::clone(&data);
    let flag_clone = Arc::clone(&flag);
    
    let producer = thread::spawn(move || {
        data_clone.store(42, Ordering::Relaxed);
        flag_clone.store(true, Ordering::Release);  // 内存屏障
    });
    
    let data_clone = Arc::clone(&data);
    let flag_clone = Arc::clone(&flag);
    
    let consumer = thread::spawn(move || {
        while !flag_clone.load(Ordering::Acquire) {  // 内存屏障
            thread::yield_now();
        }
        let value = data_clone.load(Ordering::Relaxed);
        println!("收到值: {}", value);
    });
    
    producer.join().unwrap();
    consumer.join().unwrap();
    
    // ==================== 实际应用 ====================
    println!("\n=== 实际应用 ===");
    
    // 简单的自旋锁
    struct SpinLock {
        locked: AtomicBool,
    }
    
    impl SpinLock {
        fn new() -> Self {
            SpinLock {
                locked: AtomicBool::new(false),
            }
        }
        
        fn lock(&self) {
            while self.locked.compare_exchange_weak(
                false,
                true,
                Ordering::Acquire,
                Ordering::Relaxed,
            ).is_err() {
                // 自旋等待
                std::hint::spin_loop();
            }
        }
        
        fn unlock(&self) {
            self.locked.store(false, Ordering::Release);
        }
    }
    
    let lock = Arc::new(SpinLock::new());
    let mut handles = vec![];
    
    for i in 0..5 {
        let lock = Arc::clone(&lock);
        handles.push(thread::spawn(move || {
            lock.lock();
            println!("线程 {} 获取锁", i);
            thread::sleep(std::time::Duration::from_millis(10));
            println!("线程 {} 释放锁", i);
            lock.unlock();
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("\n原子类型演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_atomic_types.rs -o 01_atomic_types.exe
//   01_atomic_types.exe
//
// Linux/macOS:
//   rustc 01_atomic_types.rs -o 01_atomic_types
//   ./01_atomic_types
// ============================================
