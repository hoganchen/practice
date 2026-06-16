// ============================================
// 知识点：并发编程
// 难度：高级
// ============================================

// Rust 通过所有权系统在编译时防止数据竞争
// 提供了线程、消息传递和共享状态等并发原语

use std::collections::HashMap;
use std::sync::{mpsc, Arc, Mutex};
use std::thread;
use std::time::Duration;

fn main() {
    // ==================== 创建线程 ====================
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("子线程: {}", i);
            thread::sleep(Duration::from_millis(100));
        }
    });
    
    for i in 1..=3 {
        println!("主线程: {}", i);
        thread::sleep(Duration::from_millis(150));
    }
    
    // 等待子线程完成
    handle.join().unwrap();
    println!("子线程已完成");
    
    // ==================== move 闭包 ====================
    // 使用 move 将变量所有权转移到线程
    
    let name = String::from("Alice");
    
    let handle = thread::spawn(move || {
        println!("你好, {}!", name);
    });
    
    // println!("{}", name);  // 错误：name 已被移动
    
    handle.join().unwrap();
    
    // ==================== 消息传递 ====================
    // 使用 mpsc 通道进行线程间通信
    
    let (tx, rx) = mpsc::channel();
    
    // 发送者
    let tx1 = tx.clone();
    thread::spawn(move || {
        let messages = vec!["你好", "来自", "线程"];
        for msg in messages {
            tx1.send(msg.to_string()).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
    });
    
    // 另一个发送者
    thread::spawn(move || {
        let messages = vec!["另一个", "线程"];
        for msg in messages {
            tx.send(msg.to_string()).unwrap();
            thread::sleep(Duration::from_millis(150));
        }
    });
    
    // 接收者
    for received in rx {
        println!("收到: {}", received);
    }
    
    // ==================== 共享状态 ====================
    // 使用 Arc<Mutex<T>> 在线程间共享可变数据
    
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    
    for i in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
            println!("线程 {} 增加了计数器", i);
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("最终计数器: {}", *counter.lock().unwrap());
    
    // ==================== 多线程数据处理 ====================
    let data = Arc::new(Mutex::new(vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    let mut handles = vec![];
    
    // 分割数据到多个线程
    for chunk in 0..2 {
        let data = Arc::clone(&data);
        let handle = thread::spawn(move || {
            let data = data.lock().unwrap();
            let start = chunk * 5;
            let end = std::cmp::min(start + 5, data.len());
            let sum: i32 = data[start..end].iter().sum();
            println!("线程 {} 计算的和: {}", chunk, sum);
            sum
        });
        handles.push(handle);
    }
    
    let mut total = 0;
    for handle in handles {
        total += handle.join().unwrap();
    }
    println!("总和: {}", total);
    
    // ==================== 线程池模拟 ====================
    let tasks = vec![
        "任务 1",
        "任务 2",
        "任务 3",
        "任务 4",
        "任务 5",
        "任务 6",
    ];
    
    let task_queue = Arc::new(Mutex::new(tasks));
    let results = Arc::new(Mutex::new(HashMap::new()));
    let mut handles = vec![];
    
    // 创建工作线程
    for worker_id in 0..3 {
        let task_queue = Arc::clone(&task_queue);
        let results = Arc::clone(&results);
        
        let handle = thread::spawn(move || loop {
            let task = {
                let mut queue = task_queue.lock().unwrap();
                queue.pop()
            };
            
            match task {
                Some(task) => {
                    println!("工人 {} 处理: {}", worker_id, task);
                    thread::sleep(Duration::from_millis(100));
                    
                    let mut results = results.lock().unwrap();
                    results.insert(task.to_string(), format!("由工人 {} 完成", worker_id));
                }
                None => break,
            }
        });
        
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    let results = results.lock().unwrap();
    println!("\n结果:");
    for (task, result) in results.iter() {
        println!("  {} -> {}", task, result);
    }
    
    // ==================== 通道与迭代器 ====================
    let (tx, rx) = mpsc::channel();
    
    // 发送者线程
    thread::spawn(move || {
        for i in 0..5 {
            tx.send(i * 2).unwrap();
        }
    });
    
    // 使用迭代器接收
    let results: Vec<i32> = rx.iter().collect();
    println!("接收的结果: {:?}", results);
    
    // ==================== 条件变量 ====================
    // 使用 Mutex 和条件通知
    
    let data_ready = Arc::new((Mutex::new(false), std::sync::Condvar::new()));
    let data = Arc::new(Mutex::new(Vec::new()));
    
    let data_ready_clone = data_ready.clone();
    let data_clone = data.clone();
    
    // 生产者
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(200));
        
        {
            let mut d = data_clone.lock().unwrap();
            d.push(1);
            d.push(2);
            d.push(3);
        }
        
        let (lock, cvar) = &*data_ready_clone;
        let mut ready = lock.lock().unwrap();
        *ready = true;
        cvar.notify_one();
    });
    
    // 消费者
    let data_ready_clone = data_ready.clone();
    let data_clone = data.clone();
    
    let handle = thread::spawn(move || {
        let (lock, cvar) = &*data_ready_clone;
        let mut ready = lock.lock().unwrap();
        
        while !*ready {
            ready = cvar.wait(ready).unwrap();
        }
        
        let d = data_clone.lock().unwrap();
        println!("接收到数据: {:?}", *d);
    });
    
    handle.join().unwrap();
    
    // ==================== 超时与选择 ====================
    // 使用 select! 宏（需要 tokio 或 async-std）
    // 这里演示简单的超时模拟
    
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(100));
        tx.send("延迟消息").unwrap();
    });
    
    // 简单的超时检测
    let start = std::time::Instant::now();
    loop {
        if let Ok(msg) = rx.try_recv() {
            println!("收到: {}", msg);
            break;
        }
        
        if start.elapsed() > Duration::from_millis(500) {
            println!("超时");
            break;
        }
        
        thread::sleep(Duration::from_millis(10));
    }
    
    // ==================== 并发与错误处理 ====================
    let (tx, rx) = mpsc::channel();
    
    for i in 0..5 {
        let tx = tx.clone();
        thread::spawn(move || {
            if i == 3 {
                // 模拟错误
                tx.send(Err(format!("任务 {} 失败", i))).unwrap();
            } else {
                tx.send(Ok(i * 10)).unwrap();
            }
        });
    }
    
    drop(tx);  // 关闭发送者
    
    // 处理结果
    for result in rx {
        match result {
            Ok(value) => println!("成功: {}", value),
            Err(e) => println!("错误: {}", e),
        }
    }
    
    println!("\n并发编程演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_concurrency.rs -o 01_concurrency.exe
//   01_concurrency.exe
//
// Linux/macOS:
//   rustc 01_concurrency.rs -o 01_concurrency
//   ./01_concurrency
// ============================================
