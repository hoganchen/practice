// ============================================================
// Rust 知识点：Future trait 与 Pin
// 编译：rustc 003_future_and_pin.rs && .\003_future_and_pin.exe
// ============================================================

use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

// ---- Future trait 定义 ----
// pub trait Future {
//     type Output;
//     fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
// }

// ---- 自定义 Future：每隔 1 秒计数 ----
struct Counter {
    count: u32,
    max: u32,
}

impl Future for Counter {
    type Output = u32;

    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<u32> {
        // 简化版：实际应该检查唤醒状态
        let this = self.get_mut();
        this.count += 1;

        if this.count >= this.max {
            println!("Counter 完成: {}", this.count);
            Poll::Ready(this.count)
        } else {
            println!("Counter 进行中: {}", this.count);
            // 实际应该使用 cx.waker() 安排唤醒
            Poll::Pending
        }
    }
}

// ---- Pin 示例 ----
// Pin 确保值不会被移动（自引用类型必需）
fn pin_example() {
    // 栈上固定
    let val = 42;
    let pinned = Pin::new(&val);
    println!("Pin 引用: {}", pinned);

    // Box::pin —— 在堆上固定
    let pinned_box = Box::pin(42);
    println!("Box::pin: {}", pinned_box);

    // Pin<Box<dyn Future>>
    let future: Pin<Box<dyn Future<Output = i32>>> = Box::pin(async {
        42
    });
    let _ = future;
}

fn main() {
    // ---- Future 是惰性的 ----
    let counter = Counter { count: 0, max: 5 };
    println!("Future 已创建（惰性）");

    // 实际项目中，Future 由运行时（如 tokio）驱动
    // 此处使用 futures crate 的 block_on
    // let result = futures::executor::block_on(counter);
    // println!("最终结果: {}", result);

    println!("Future 需要执行器（executor）来驱动");

    pin_example();

    // ---- Pin 的必要性 ----
    // async fn 块可能包含自引用结构
    // 如：let a = "hello"; let b = &a;
    // 如果不固定，移动可能导致悬垂指针
    println!("");
    println!("Pin 确保自引用 Future 不会被移动");
    println!("这是 async/await 安全性的关键");

    // ---- 创建自引用 Future ----
    // 编译器自动处理 async 块中的自引用
    let _fut = async {
        let x = String::from("hello");
        let ref_x = &x; // 自引用！
        println!("{}", ref_x);
    };
    // _fut 的类型由编译器生成，包含 Pin 保证
}
