// ============================================================
// Rust 知识点：作用域线程（Scoped Threads）
// Rust 1.63+ — 允许线程借用局部变量，无需 move
// 编译：rustc 004_scoped_threads.rs && .\004_scoped_threads.exe
// ============================================================

use std::thread;

fn main() {
    // ---- 常规线程（需要 move） ----
    let v = vec![1, 2, 3];
    let handle = thread::spawn(move || {
        println!("常规线程: {:?}", v);
    });
    handle.join().unwrap();
    // println!("{:?}", v); // v 已被移动

    // ---- 作用域线程（可以借用） ----
    let numbers = vec![4, 5, 6];
    let result = vec![0; 3];

    thread::scope(|s| {
        // 在线程中借用 numbers 和 result
        s.spawn(|| {
            println!("作用域线程: {:?}", numbers);
            // 修改 result（需要 &mut 要有）
        });

        s.spawn(|| {
            println!("另一个线程: {:?}", numbers);
        });
    }); // 所有线程在此结束

    // 借用结束后，变量仍然可用
    println!("numbers 仍然有效: {:?}", numbers);

    // ---- 作用域线程共享可变引用 ----
    let mut results = vec![0u64; 10];

    let mut handles = vec![];

    thread::scope(|s| {
        // 每个线程处理数组的一部分
        for chunk in results.chunks_mut(2) {
            // 每个线程获得一个可变切片
            s.spawn(|| {
                for val in chunk.iter_mut() {
                    *val = 42;
                }
            });
        }
    });

    println!("修改后的结果: {:?}", results);

    // ---- 作用域线程返回值 ----
    let values = vec![1, 2, 3, 4, 5];

    let sum = thread::scope(|s| {
        let mut handles = vec![];

        for chunk in values.chunks(2) {
            let handle = s.spawn(|| {
                chunk.iter().sum::<i32>()
            });
            handles.push(handle);
        }

        // 收集所有线程的返回值
        handles.into_iter().map(|h| h.join()).sum::<i32>()
    });

    println!("各块求和: {}", sum);
}
