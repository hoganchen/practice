// ============================================
// 知识点：异步编程
// 难度：高级
// ============================================

// Rust 使用 async/await 进行异步编程
// 需要运行时库如 tokio

// 注意：此示例需要 tokio 依赖
// 在 Cargo.toml 中添加：
// [dependencies]
// tokio = { version = "1", features = ["full"] }

// 由于这是一个独立示例，我们使用同步模拟异步行为
// 实际项目中请使用 tokio

use std::future::Future;
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll};
use std::time::Duration;

fn main() {
    println!("异步编程示例演示");
    println!("注意：完整示例需要 tokio 运行时");
    println!("请查看源代码了解 async/await 概念");
    
    // ==================== 基础异步函数 ====================
    // async fn 返回一个实现了 Future trait 的值
    
    // 使用简单模拟演示异步概念
    
    // ==================== Future trait ====================
    // Future 是异步计算的核心抽象
    
    struct MyFuture {
        state: u32,
    }
    
    impl MyFuture {
        fn new() -> Self {
            MyFuture { state: 0 }
        }
    }
    
    impl Future for MyFuture {
        type Output = String;
        
        fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
            self.state += 1;
            
            match self.state {
                1 => {
                    println!("第一次轮询");
                    cx.waker().wake_by_ref();
                    Poll::Pending
                }
                2 => {
                    println!("第二次轮询");
                    Poll::Ready("完成!".to_string())
                }
                _ => Poll::Ready("已".to_string()),
            }
        }
    }
    
    // 模拟异步执行
    let mut future = MyFuture::new();
    let mut cx = std::task::Waker::noop();
    
    let mut result = Pin::new(&mut future).poll(&mut cx);
    println!("第一次结果: {:?}", result);
    
    // 在实际异步运行时中，会自动进行轮询
    
    // ==================== async 块 ====================
    let async_block = async {
        println!("异步块执行");
        42
    };
    
    println!("异步块已创建");
    
    // ==================== async move ====================
    let name = String::from("Rust");
    let async_move = async move {
        println!("Hello, {}!", name);
    };
    
    println!("async move 块已创建");
    
    // ==================== 异步并发模式 ====================
    // 演示异步并发的概念
    
    println!("\n异步并发模式:");
    
    // 模拟异步任务
    fn simulated_async_task(id: u32) {
        println!("任务 {} 开始", id);
        // 在实际异步代码中，这里会是异步操作
        println!("任务 {} 完成", id);
    }
    
    // 顺序执行
    println!("\n顺序执行:");
    for i in 0..3 {
        simulated_async_task(i);
    }
    
    // 并发执行（使用线程模拟）
    println!("\n并发执行（线程模拟）:");
    let handles: Vec<_> = (0..3)
        .map(|i| {
            std::thread::spawn(move || {
                simulated_async_task(i);
            })
        })
        .collect();
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    // ==================== 异步通道 ====================
    // 使用 std::sync::mpsc 模拟异步通道
    
    println!("\n异步通道模拟:");
    
    let (tx, rx) = std::sync::mpsc::channel();
    
    // 发送者线程
    std::thread::spawn(move || {
        for i in 0..5 {
            tx.send(format!("消息 {}", i)).unwrap();
            std::thread::sleep(Duration::from_millis(100));
        }
    });
    
    // 接收者
    for msg in rx {
        println!("收到: {}", msg);
    }
    
    // ==================== 异步状态管理 ====================
    // 使用 Arc<Mutex<T>> 模拟异步状态共享
    
    println!("\n异步状态管理模拟:");
    
    let state = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    
    for i in 0..5 {
        let state = Arc::clone(&state);
        let handle = std::thread::spawn(move || {
            let mut num = state.lock().unwrap();
            *num += 1;
            println!("任务 {} 更新状态: {}", i, *num);
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("最终状态: {}", *state.lock().unwrap());
    
    // ==================== 异步错误处理 ====================
    println!("\n异步错误处理模拟:");
    
    fn simulated_async_operation(success: bool) -> Result<String, String> {
        if success {
            Ok("操作成功".to_string())
        } else {
            Err("操作失败".to_string())
        }
    }
    
    match simulated_async_operation(true) {
        Ok(msg) => println!("成功: {}", msg),
        Err(e) => println!("错误: {}", e),
    }
    
    match simulated_async_operation(false) {
        Ok(msg) => println!("成功: {}", msg),
        Err(e) => println!("错误: {}", e),
    }
    
    // ==================== 异步与迭代器 ====================
    println!("\n异步与迭代器模拟:");
    
    // 使用线程池模拟异步迭代
    let data = vec![1, 2, 3, 4, 5];
    let results: Arc<Mutex<Vec<i32>>> = Arc::new(Mutex::new(Vec::new()));
    let mut handles = vec![];
    
    for item in data {
        let results = Arc::clone(&results);
        let handle = std::thread::spawn(move || {
            let processed = item * 2;
            let mut results = results.lock().unwrap();
            results.push(processed);
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    let results = results.lock().unwrap();
    println!("处理结果: {:?}", *results);
    
    // ==================== 异步资源管理 ====================
    println!("\n异步资源管理模拟:");
    
    struct AsyncResource {
        name: String,
    }
    
    impl Drop for AsyncResource {
        fn drop(&mut self) {
            println!("资源 '{}' 已释放", self.name);
        }
    }
    
    {
        let _resource1 = AsyncResource {
            name: "文件句柄".to_string(),
        };
        let _resource2 = AsyncResource {
            name: "网络连接".to_string(),
        };
        println!("资源已创建");
    }
    println!("资源已自动释放");
    
    // ==================== 异步最佳实践 ====================
    println!("\n异步最佳实践:");
    
    // 1. 避免在异步函数中执行阻塞操作
    // 2. 使用异步友好的库
    // 3. 合理使用超时
    // 4. 处理取消和超时
    // 5. 避免异步函数中的长时间运行操作
    
    println!("异步编程演示完成!");
    println!("\n完整异步示例请参考 tokio 文档:");
    println!("https://tokio.rs/tokio/tutorial");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_async_await.rs -o 01_async_await.exe
//   01_async_await.exe
//
// Linux/macOS:
//   rustc 01_async_await.rs -o 01_async_await
//   ./01_async_await
//
// 注意：完整异步示例需要 tokio：
//   cargo new async_example
//   cd async_example
//   # 编辑 Cargo.toml 添加 tokio 依赖
//   cargo run
// ============================================
