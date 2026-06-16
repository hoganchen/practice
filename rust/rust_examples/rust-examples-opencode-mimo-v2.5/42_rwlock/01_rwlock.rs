// ============================================
// 知识点：RwLock 读写锁
// 难度：高级
// ============================================

// RwLock 允许多个读取者或一个写入者
// 位于 std::sync::RwLock

use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    // ==================== 基础 RwLock ====================
    println!("=== 基础 RwLock ===");
    
    let lock = Arc::new(RwLock::new(vec![1, 2, 3]));
    
    // 读取
    {
        let data = lock.read().unwrap();
        println!("读取: {:?}", *data);
    }
    
    // 写入
    {
        let mut data = lock.write().unwrap();
        data.push(4);
        println!("写入后: {:?}", *data);
    }
    
    // ==================== 多个读取者 ====================
    println!("\n=== 多个读取者 ===");
    
    let data = Arc::new(RwLock::new(String::from("共享数据")));
    let mut handles = vec![];
    
    // 多个读取者可以同时读取
    for i in 0..5 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let data = data.read().unwrap();
            println!("读取者 {} 看到: {}", i, *data);
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    // ==================== 读写分离 ====================
    println!("\n=== 读写分离 ===");
    
    let config = Arc::new(RwLock::new(std::collections::HashMap::new()));
    
    // 写入者线程
    let config_clone = Arc::clone(&config);
    let writer = thread::spawn(move || {
        let mut config = config_clone.write().unwrap();
        config.insert("host".to_string(), "localhost".to_string());
        config.insert("port".to_string(), "8080".to_string());
        println!("写入者: 配置已更新");
    });
    
    // 读取者线程
    let config_clone = Arc::clone(&config);
    let reader = thread::spawn(move || {
        thread::sleep(std::time::Duration::from_millis(100));
        let config = config_clone.read().unwrap();
        println!("读取者: 配置 = {:?}", *config);
    });
    
    writer.join().unwrap();
    reader.join().unwrap();
    
    // ==================== RwLock vs Mutex ====================
    println!("\n=== RwLock vs Mutex ===");
    
    println!("RwLock:");
    println!("  - 允许多个读取者");
    println!("  - 只允许一个写入者");
    println!("  - 适合读多写少的场景");
    println!();
    println!("Mutex:");
    println!("  - 只允许一个线程访问");
    println!("  - 适合写多或读写均衡的场景");
    
    // ==================== 读写锁与迭代器 ====================
    println!("\n=== 读写锁与迭代器 ===");
    
    let numbers = Arc::new(RwLock::new(vec![1, 2, 3, 4, 5]));
    
    // 写入者添加数据
    let numbers_clone = Arc::clone(&numbers);
    let writer = thread::spawn(move || {
        let mut nums = numbers_clone.write().unwrap();
        nums.extend(6..=10);
        println!("写入者: 添加了 6-10");
    });
    
    // 读取者读取数据
    let numbers_clone = Arc::clone(&numbers);
    let reader = thread::spawn(move || {
        thread::sleep(std::time::Duration::from_millis(50));
        let nums = numbers_clone.read().unwrap();
        let sum: i32 = nums.iter().sum();
        println!("读取者: 总和 = {}", sum);
    });
    
    writer.join().unwrap();
    reader.join().unwrap();
    
    // ==================== RwLock 与错误处理 ====================
    println!("\n=== RwLock 与错误处理 ===");
    
    let data = Arc::new(RwLock::new(Vec::new()));
    
    // 模拟写入失败
    let data_clone = Arc::clone(&data);
    let handle = thread::spawn(move || {
        // 获取写锁
        let mut data = data_clone.write().unwrap();
        data.push(1);
        // 在实际应用中，这里可能会有错误处理
    });
    
    handle.join().unwrap();
    
    let data = data.read().unwrap();
    println!("数据: {:?}", *data);
    
    // ==================== RwLock 与条件变量 ====================
    println!("\n=== RwLock 与条件变量 ===");
    
    use std::sync::Condvar;
    
    let pair = Arc::new((RwLock::new(false), Condvar::new()));
    let pair_clone = Arc::clone(&pair);
    
    // 等待者
    let waiter = thread::spawn(move || {
        let (lock, cvar) = &*pair_clone;
        let mut ready = lock.write().unwrap();
        
        while !*ready {
            ready = cvar.wait(ready).unwrap();
        }
        
        println!("等待者: 收到通知");
    });
    
    // 通知者
    let notifier = thread::spawn(move || {
        thread::sleep(std::time::Duration::from_millis(100));
        
        let (lock, cvar) = &*pair;
        let mut ready = lock.write().unwrap();
        *ready = true;
        cvar.notify_one();
        println!("通知者: 已通知");
    });
    
    waiter.join().unwrap();
    notifier.join().unwrap();
    
    // ==================== RwLock 与性能 ====================
    println!("\n=== RwLock 与性能 ===");
    
    use std::sync::Mutex;
    
    let rw_data = Arc::new(RwLock::new(0));
    let mutex_data = Arc::new(Mutex::new(0));
    
    // RwLock 性能测试
    let start = std::time::Instant::now();
    let mut handles = vec![];
    
    for _ in 0..10 {
        let data = Arc::clone(&rw_data);
        handles.push(thread::spawn(move || {
            for _ in 0..1000 {
                let _ = data.read().unwrap();
            }
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    let rw_time = start.elapsed();
    println!("RwLock 读取耗时: {:?}", rw_time);
    
    // Mutex 性能测试
    let start = std::time::Instant::now();
    let mut handles = vec![];
    
    for _ in 0..10 {
        let data = Arc::clone(&mutex_data);
        handles.push(thread::spawn(move || {
            for _ in 0..1000 {
                let _ = data.lock().unwrap();
            }
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    let mutex_time = start.elapsed();
    println!("Mutex 读取耗时: {:?}", mutex_time);
    
    // ==================== 实际应用 ====================
    println!("\n=== 实际应用 ===");
    
    // 缓存实现
    struct Cache<T> {
        data: RwLock<Option<T>>,
    }
    
    impl<T: Clone> Cache<T> {
        fn new() -> Self {
            Cache {
                data: RwLock::new(None),
            }
        }
        
        fn get(&self) -> Option<T> {
            let data = self.data.read().unwrap();
            data.clone()
        }
        
        fn set(&self, value: T) {
            let mut data = self.data.write().unwrap();
            *data = Some(value);
        }
    }
    
    let cache = Arc::new(Cache::new());
    
    // 写入缓存
    let cache_clone = Arc::clone(&cache);
    let writer = thread::spawn(move || {
        cache_clone.set(String::from("缓存数据"));
        println!("写入者: 数据已缓存");
    });
    
    // 读取缓存
    let cache_clone = Arc::clone(&cache);
    let reader = thread::spawn(move || {
        thread::sleep(std::time::Duration::from_millis(100));
        if let Some(data) = cache_clone.get() {
            println!("读取者: 从缓存获取: {}", data);
        }
    });
    
    writer.join().unwrap();
    reader.join().unwrap();
    
    println!("\nRwLock 读写锁演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_rwlock.rs -o 01_rwlock.exe
//   01_rwlock.exe
//
// Linux/macOS:
//   rustc 01_rwlock.rs -o 01_rwlock
//   ./01_rwlock
// ============================================
