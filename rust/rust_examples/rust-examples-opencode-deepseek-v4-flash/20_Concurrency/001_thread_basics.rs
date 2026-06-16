// ============================================================
// Rust 知识点：线程基础 —— std::thread
// 编译：rustc 001_thread_basics.rs && .\001_thread_basics.exe
// ============================================================

use std::thread;
use std::time::Duration;

fn main() {
    // ---- 创建线程 ----
    // thread::spawn 接受一个闭包
    let handle = thread::spawn(|| {
        for i in 1..5 {
            println!("子线程: {}", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    // 主线程继续执行
    for i in 1..3 {
        println!("主线程: {}", i);
        thread::sleep(Duration::from_millis(1));
    }

    // join：等待子线程结束
    handle.join().unwrap();

    println!("两个线程都已完成");

    // ---- move 闭包 ----
    let v = vec![1, 2, 3];

    // move 关键字将 v 的所有权转移到子线程
    let handle = thread::spawn(move || {
        println!("子线程中的向量: {:?}", v);
    });
    // println!("{:?}", v); // 编译错误！v 已移动到子线程

    handle.join().unwrap();

    // ---- 创建多个线程 ----
    let mut handles = vec![];

    for i in 0..5 {
        let handle = thread::spawn(move || {
            println!("线程 {} 开始", i);
            thread::sleep(Duration::from_millis(10));
            println!("线程 {} 结束", i);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("所有线程结束");

    // ---- Builder：自定义线程属性 ----
    let builder = thread::Builder::new()
        .name("worker-thread".into())
        .stack_size(1024 * 1024); // 1MB 栈

    let handle = builder.spawn(|| {
        println!("自定义线程: {:?}", thread::current().name());
    }).unwrap();

    handle.join().unwrap();
}
