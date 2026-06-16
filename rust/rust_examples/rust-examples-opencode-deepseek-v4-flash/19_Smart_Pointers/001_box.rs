// ============================================================
// Rust 知识点：Box<T> —— 堆分配指针
// Box 将数据存储在堆上，栈上只保留指向堆数据的指针
// 编译：rustc 001_box.rs && .\001_box.exe
// ============================================================

// Box 的重要用途：递归类型
// Cons List：经典链表实现
#[derive(Debug)]
enum List {
    Cons(i32, Box<List>), // Box 使递归成为可能
    Nil,
}

use List::{Cons, Nil};

fn main() {
    // ---- 基本使用 ----
    // 在堆上存储整数
    let b = Box::new(5);
    println!("b = {}", b); // 自动解引用

    // 解引用
    let val = *b;
    println!("解引用后: {}", val);

    // ---- 递归类型（Cons List） ----
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
    println!("列表: {:?}", list);

    // ---- Box 与 trait 对象 ----
    trait Draw {
        fn draw(&self);
    }

    struct Circle {
        radius: f64,
    }

    impl Draw for Circle {
        fn draw(&self) {
            println!("画圆，半径: {}", self.radius);
        }
    }

    struct Square {
        side: f64,
    }

    impl Draw for Square {
        fn draw(&self) {
            println!("画正方形，边长: {}", self.side);
        }
    }

    // 使用 Box<dyn Trait> 存储不同类型
    let shapes: Vec<Box<dyn Draw>> = vec![
        Box::new(Circle { radius: 5.0 }),
        Box::new(Square { side: 3.0 }),
    ];

    for shape in shapes {
        shape.draw();
    }

    // ---- Box 的性能特点 ----
    // 1. 解引用是间接的（比栈数据慢一点）
    // 2. 分配和释放有少量开销
    // 3. 适用于：大型数据迁移、递归类型、trait 对象

    // ---- Box::new vs Box::leak ----
    let boxed = Box::new(42);
    let leaked: &'static mut i32 = Box::leak(boxed);
    *leaked = 100;
    println!("leaked: {}", leaked);
}
