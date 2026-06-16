// ============================================================
// Rust 知识点：共享状态 —— Arc<Mutex<T>>
// Mutex：互斥锁，保证同一时间只有一个线程访问数据
// Arc：原子引用计数，在线程间共享所有权
// 编译：rustc 003_shared_state_mutex.rs && .\003_shared_state_mutex.exe
// ============================================================

use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // ---- 基本 Mutex 用法 ----
    let m = Mutex::new(5);

    {
        let mut num = m.lock().unwrap(); // 获取锁
        *num = 6; // 修改数据
    } // 锁自动释放

    println!("m = {:?}", m);

    // ---- 在线程间共享 Mutex ----
    // 使用 Arc 让多个线程共享 Mutex
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
            // 锁在这里自动释放
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("计数结果: {}", *counter.lock().unwrap()); // 10

    // ---- Mutex 的毒化（Poisoning） ----
    // 如果持有锁的线程 panic，Mutex 会被毒化
    let lock = Arc::new(Mutex::new(0));
    let lock2 = Arc::clone(&lock);

    let handle = thread::spawn(move || {
        let _guard = lock2.lock().unwrap();
        panic!("锁被毒化了！");
    });

    assert!(handle.join().is_err());

    // 访问毒化的锁
    let result = lock.lock();
    match result {
        Ok(_) => println!("锁正常"),
        Err(poisoned) => {
            println!("锁被毒化，恢复数据");
            let val = poisoned.into_inner();
            println!("恢复后值: {}", val);
        }
    }

    // ---- RwLock（读写锁） ----
    use std::sync::RwLock;

    let rw_lock = Arc::new(RwLock::new(0));
    let mut handles = vec![];

    // 多个读线程
    for _ in 0..3 {
        let rw = Arc::clone(&rw_lock);
        handles.push(thread::spawn(move || {
            let val = rw.read().unwrap();
            println!("读: {}", val);
        }));
    }

    // 一个写线程
    let rw = Arc::clone(&rw_lock);
    handles.push(thread::spawn(move || {
        let mut val = rw.write().unwrap();
        *val = 42;
        println!("写: 42");
    }));

    for handle in handles {
        handle.join().unwrap();
    }

    println!("RwLock 最终值: {}", *rw_lock.read().unwrap());
}
