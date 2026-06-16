// ============================================================
// Rust 知识点：Deref 解引用与隐式转换
// 编译：rustc 005_deref_coercion.rs && .\005_deref_coercion.exe
// ============================================================

use std::ops::Deref;

// ---- 自定义智能指针（演示 Deref） ----
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.0 // 返回内部数据的引用
    }
}

// ---- 接受 &str 的函数 ----
fn greet(name: &str) {
    println!("你好，{}！", name);
}

fn main() {
    // ========== 解引用运算符 * ==========
    let x = 5;
    let y = &x;       // y 是 &i32

    assert_eq!(5, x);
    assert_eq!(5, *y); // 通过 * 解引用

    // ========== Box 的解引用 ==========
    let boxed = Box::new(42);
    println!("boxed = {}", *boxed); // 解引用 Box

    // ========== 自定义 MyBox 的解引用 ==========
    let my_box = MyBox::new(100);
    println!("my_box = {}", *my_box); // 调用 deref

    // ========== Deref 隐式转换 ==========
    // MyBox<String> 自动转为 &String，再自动转为 &str
    let name = MyBox::new(String::from("Alice"));
    greet(&name); // &MyBox<String> -> &String -> &str

    // 正常的 String 也会自动转换
    let name2 = String::from("Bob");
    greet(&name2); // &String -> &str

    // ---- 隐式转换的链式调用 ----
    let s = MyBox::new(String::from("Rust"));
    // &MyBox<String> -> &String -> &str
    let len: usize = s.len(); // 自动解引用调用的 String::len
    println!("s 长度 = {}", len);

    // ---- Deref 与可变引用 ----
    // DerefMut 用于 &mut T 的解引用
    let mut val = MyBox::new(10);
    *val = 20; // 如果实现了 DerefMut
    println!("val = {}", *val);
}
