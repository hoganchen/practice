// ============================================================
// Rust 知识点：Move（移动）vs Clone（克隆）
// 编译：rustc 002_move_vs_clone.rs && .\002_move_vs_clone.exe
// ============================================================

fn main() {
    // ========== Move（移动语义） ==========
    // 堆数据默认是移动语义
    let s1 = String::from("hello");
    let s2 = s1; // 移动：s1 的所有权转给 s2
    // s1 已失效
    println!("s2 = {}", s2);

    // ========== Clone（克隆/深拷贝） ==========
    // 显式调用 .clone() 方法产生深拷贝
    let s3 = String::from("world");
    let s4 = s3.clone(); // 深拷贝：s3 和 s4 各有独立数据
    println!("s3 = {}, s4 = {}", s3, s4); // 两者都有效

    // ========== Copy（自动拷贝） ==========
    // 实现 Copy trait 的类型在赋值时会自动拷贝（而不是移动）
    // 常见 Copy 类型：整数、浮点、布尔、char、元组（仅含 Copy 类型时）
    let a = 42;
    let b = a; // 自动拷贝（a 是 i32，实现了 Copy）
    println!("a = {}, b = {}", a, b); // 都有效

    // ========== 函数参数中的 Move vs Copy ==========
    let num = 100;
    let s = String::from("test");

    copy_value(num);  // i32 实现 Copy，传递副本
    println!("num 仍有效: {}", num);

    move_value(s);    // String 未实现 Copy，所有权被转移
    // println!("{}", s); // 编译错误！

    // ========== 部分移动（Partial Move） ==========
    let tuple = (String::from("a"), String::from("b"), 42);
    let (first, _, _) = tuple; // 仅移动了 first
    // println!("{:?}", tuple); // 编译错误！元组部分移动后整体不可用
    println!("first = {}", first);
}

fn copy_value(n: i32) {
    println!("拷贝传入: {}", n);
}

fn move_value(s: String) {
    println!("移动传入: {}", s);
}
