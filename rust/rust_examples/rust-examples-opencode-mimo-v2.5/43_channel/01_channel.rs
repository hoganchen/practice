// ============================================
// 知识点：通道（Channel）详解
// 难度：高级
// ============================================

// 通道用于线程间通信
// 提供消息传递而非共享内存

use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    // ==================== 基础通道 ====================
    println!("=== 基础通道 ===");
    
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        tx.send("Hello from thread").unwrap();
    });
    
    let message = rx.recv().unwrap();
    println!("收到: {}", message);
    
    // ==================== 多个消息 ====================
    println!("\n=== 多个消息 ===");
    
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        let messages = vec!["消息1", "消息2", "消息3"];
        for msg in messages {
            tx.send(msg).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
    });
    
    // 使用迭代器接收
    for received in rx {
        println!("收到: {}", received);
    }
    
    // ==================== 多个发送者 ====================
    println!("\n=== 多个发送者 ===");
    
    let (tx, rx) = mpsc::channel();
    
    // 克隆发送者
    for i in 0..5 {
        let tx = tx.clone();
        thread::spawn(move || {
            tx.send(format!("线程 {} 发送", i)).unwrap();
        });
    }
    
    // 丢弃原始发送者
    drop(tx);
    
    // 接收所有消息
    for received in rx {
        println!("收到: {}", received);
    }
    
    // ==================== 通道与结构体 ====================
    println!("\n=== 通道与结构体 ===");
    
    #[derive(Debug)]
    struct Message {
        id: u32,
        content: String,
    }
    
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        for i in 0..5 {
            let msg = Message {
                id: i,
                content: format!("消息内容 {}", i),
            };
            tx.send(msg).unwrap();
        }
    });
    
    for msg in rx {
        println!("收到: {:?}", msg);
    }
    
    // ==================== 通道与错误处理 ====================
    println!("\n=== 通道与错误处理 ===");
    
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        for i in 0..5 {
            if i == 3 {
                // 模拟错误
                tx.send(Err(format!("错误 {}", i))).unwrap();
            } else {
                tx.send(Ok(i * 10)).unwrap();
            }
        }
    });
    
    for result in rx {
        match result {
            Ok(value) => println!("成功: {}", value),
            Err(e) => println!("错误: {}", e),
        }
    }
    
    // ==================== 通道与同步 ====================
    println!("\n=== 通道与同步 ===");
    
    let (tx, rx) = mpsc::channel();
    
    // 生产者
    thread::spawn(move || {
        for i in 0..5 {
            tx.send(i).unwrap();
            println!("生产: {}", i);
        }
    });
    
    // 消费者（同步接收）
    for received in rx {
        println!("消费: {}", received);
        thread::sleep(Duration::from_millis(200));
    }
    
    // ==================== 通道与超时 ====================
    println!("\n=== 通道与超时 ===");
    
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(300));
        tx.send("延迟消息").unwrap();
    });
    
    // 尝试接收（带超时）
    let start = std::time::Instant::now();
    loop {
        match rx.try_recv() {
            Ok(msg) => {
                println!("收到: {}", msg);
                break;
            }
            Err(mpsc::TryRecvError::Empty) => {
                if start.elapsed() > Duration::from_millis(500) {
                    println!("超时");
                    break;
                }
                thread::sleep(Duration::from_millis(10));
            }
            Err(mpsc::TryRecvError::Disconnected) => {
                println!("通道已断开");
                break;
            }
        }
    }
    
    // ==================== 通道与迭代器 ====================
    println!("\n=== 通道与迭代器 ===");
    
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        for i in 0..10 {
            tx.send(i * 2).unwrap();
        }
    });
    
    // 使用迭代器处理
    let results: Vec<i32> = rx.iter().filter(|x| x % 3 == 0).collect();
    println!("能被3整除的结果: {:?}", results);
    
    // ==================== 通道与并行处理 ====================
    println!("\n=== 通道与并行处理 ===");
    
    let (tx, rx) = mpsc::channel();
    let num_workers = 4;
    let num_tasks = 20;
    
    // 分发任务
    for i in 0..num_tasks {
        let tx = tx.clone();
        thread::spawn(move || {
            let result = i * i;
            tx.send((i, result)).unwrap();
        });
    }
    
    drop(tx);
    
    // 收集结果
    let results: Vec<(i32, i32)> = rx.iter().collect();
    println!("处理了 {} 个任务", results.len());
    
    // ==================== 通道与管道 ====================
    println!("\n=== 通道与管道 ===");
    
    fn pipeline(input: &str) -> String {
        input.to_uppercase()
    }
    
    let (tx1, rx1) = mpsc::channel();
    let (tx2, rx2) = mpsc::channel();
    
    // 第一个阶段
    thread::spawn(move || {
        for i in 0..5 {
            let data = format!("数据 {}", i);
            tx1.send(data).unwrap();
        }
    });
    
    // 第二个阶段
    thread::spawn(move || {
        for data in rx1 {
            let processed = pipeline(&data);
            tx2.send(processed).unwrap();
        }
    });
    
    // 收集结果
    for result in rx2 {
        println!("管道输出: {}", result);
    }
    
    // ==================== 通道与状态机 ====================
    println!("\n=== 通道与状态机 ===");
    
    enum State {
        Idle,
        Working,
        Done,
    }
    
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        let mut state = State::Idle;
        
        loop {
            match state {
                State::Idle => {
                    println!("状态: 空闲");
                    state = State::Working;
                }
                State::Working => {
                    println!("状态: 工作中");
                    tx.send("任务完成").unwrap();
                    state = State::Done;
                }
                State::Done => {
                    println!("状态: 完成");
                    break;
                }
            }
        }
    });
    
    for msg in rx {
        println!("收到: {}", msg);
    }
    
    // ==================== 通道与性能 ====================
    println!("\n=== 通道与性能 ===");
    
    let (tx, rx) = mpsc::channel();
    let start = std::time::Instant::now();
    
    thread::spawn(move || {
        for i in 0..100000 {
            tx.send(i).unwrap();
        }
    });
    
    let count = rx.iter().count();
    let duration = start.elapsed();
    
    println!("传输了 {} 条消息，耗时: {:?}", count, duration);
    
    // ==================== 实际应用 ====================
    println!("\n=== 实际应用 ===");
    
    // 工作队列
    let (task_tx, task_rx) = mpsc::channel();
    let (result_tx, result_rx) = mpsc::channel();
    
    // 启动工作线程
    for worker_id in 0..3 {
        let task_rx = task_rx.clone();
        let result_tx = result_tx.clone();
        
        thread::spawn(move || {
            for task in task_rx {
                let result = format!("Worker {} 处理: {}", worker_id, task);
                result_tx.send(result).unwrap();
            }
        });
    }
    
    drop(task_rx);
    drop(result_tx);
    
    // 分发任务
    for i in 0..6 {
        task_tx.send(format!("任务 {}", i)).unwrap();
    }
    drop(task_tx);
    
    // 收集结果
    for result in result_rx {
        println!("结果: {}", result);
    }
    
    println!("\n通道详解演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_channel.rs -o 01_channel.exe
//   01_channel.exe
//
// Linux/macOS:
//   rustc 01_channel.rs -o 01_channel
//   ./01_channel
// ============================================
