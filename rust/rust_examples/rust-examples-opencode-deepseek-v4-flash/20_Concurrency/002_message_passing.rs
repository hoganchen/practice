// ============================================================
// Rust 知识点：消息传递 —— channel（通道）
// 使用 mpsc（多生产者，单消费者）在线程间传递消息
// 编译：rustc 002_message_passing.rs && .\002_message_passing.exe
// ============================================================

use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    // ---- 基本通道 ----
    // channel() 返回 (发送端, 接收端)
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("你好");
        tx.send(val).unwrap();
        // println!("{}", val); // 编译错误！val 已发送给接收端
    });

    // recv：阻塞接收
    let received = rx.recv().unwrap();
    println!("收到: {}", received);

    // ---- 发送多条消息 ----
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let vals = vec![
            String::from("消息 1"),
            String::from("消息 2"),
            String::from("消息 3"),
        ];

        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
    });

    // 将 rx 视为迭代器
    for received in rx {
        println!("收到: {}", received);
    }

    // ---- 多生产者 ----
    let (tx, rx) = mpsc::channel();

    // 克隆发送端
    let tx1 = mpsc::Sender::clone(&tx);

    thread::spawn(move || {
        tx1.send("来自线程 1").unwrap();
    });

    thread::spawn(move || {
        tx.send("来自线程 2").unwrap();
    });

    // 接收两个消息
    for _ in 0..2 {
        println!("收到: {}", rx.recv().unwrap());
    }

    // ---- try_recv（非阻塞接收） ----
    let (tx, rx) = mpsc::channel();
    tx.send("hello").unwrap();

    // 立即尝试接收，不阻塞
    match rx.try_recv() {
        Ok(msg) => println!("非阻塞收到: {}", msg),
        Err(e) => println!("接收错误: {:?}", e),
    }

    // ---- 同步通道（带缓冲限制） ----
    // sync_channel 限制缓冲大小
    let (tx, rx) = mpsc::sync_channel(0); // 无缓冲

    thread::spawn(move || {
        println!("发送前...");
        tx.send("数据").unwrap(); // 会阻塞直到接收端接收
        println!("发送后...");
    });

    thread::sleep(Duration::from_millis(100));
    println!("接收端准备接收...");
    let msg = rx.recv().unwrap();
    println!("收到: {}", msg);
}
