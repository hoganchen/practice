// ============================================================
// Rust 知识点：Rc<T>（引用计数） 和 Arc<T>（原子引用计数）
// Rc：单线程引用计数
// Arc：多线程引用计数（线程安全）
// 编译：rustc 002_rc_arc.rs && .\002_rc_arc.exe
// ============================================================

use std::rc::Rc;
use std::sync::Arc;
use std::thread;

fn main() {
    // ========== Rc<T>（单线程引用计数） ==========
    // 允许多个所有者共享同一个数据（只读）

    let shared = Rc::new(String::from("共享数据"));
    println!("初始引用计数: {}", Rc::strong_count(&shared));

    {
        let clone1 = Rc::clone(&shared); // 增加引用计数
        let clone2 = Rc::clone(&shared);
        println!("克隆后引用计数: {}", Rc::strong_count(&shared));

        println!("clone1: {}", clone1);
        println!("clone2: {}", clone2);
    } // clone1, clone2 离开作用域，引用计数减少

    println!("离开内部作用域后: {}", Rc::strong_count(&shared));

    // ---- Rc 与内部可变性结合（见 RefCell 示例） ----

    // ---- Rc 的弱引用 Weak ----
    use std::rc::Weak;
    let weak_ref = Rc::downgrade(&shared); // 创建弱引用（不增加计数）
    println!("强引用: {}, 弱引用: {}",
        Rc::strong_count(&shared),
        Rc::weak_count(&shared));

    if let Some(val) = weak_ref.upgrade() {
        println!("弱引用升级成功: {}", val);
    }

    // ========== Arc<T>（多线程引用计数） ==========
    // Arc = Atomic Rc，可以在线程间共享

    let arc_data = Arc::new(vec![1, 2, 3, 4, 5]);

    let mut handles = vec![];

    for i in 0..3 {
        let data = Arc::clone(&arc_data);
        let handle = thread::spawn(move || {
            println!("线程 {}: 数据 = {:?}", i, data);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("所有线程完成");

    // ========== 使用 Arc<Mutex<T>> 实现共享可变状态 ==========
    use std::sync::Mutex;

    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..5 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终计数: {}", *counter.lock().unwrap());
}
