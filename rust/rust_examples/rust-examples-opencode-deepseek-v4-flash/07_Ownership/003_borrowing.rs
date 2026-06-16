// ============================================================
// Rust 知识点：借用（Borrowing）—— 引用不转移所有权
// 用 & 符号创建引用，允许在不转移所有权的情况下使用值
// 编译：rustc 003_borrowing.rs && .\003_borrowing.exe
// ============================================================

fn main() {
    // ---- 不可变引用（&T） ----
    let s1 = String::from("hello");
    let len = calculate_length(&s1); // 借用 s1（不转移所有权）
    println!("'{}' 的长度是 {}", s1, len); // s1 仍然有效

    // ---- 可变引用（&mut T） ----
    let mut s2 = String::from("hello");
    change_string(&mut s2);         // 可变借用
    println!("修改后: {}", s2);

    // ---- 引用的规则 ----
    // 在任意给定时间，要么：
    //   1. 一个可变引用，或者
    //   2. 任意数量的不可变引用

    let mut s = String::from("data");

    let r1 = &s; // 不可变引用 #1
    let r2 = &s; // 不可变引用 #2（允许）
    println!("{} 和 {}", r1, r2);
    // r1 和 r2 不再使用

    let r3 = &mut s; // 可变引用（此时可以）
    println!("{}", r3);

    // ---- 悬垂引用（Dangling Reference） ----
    // Rust 编译器在编译时防止悬垂引用
    // let reference_to_nothing = dangle(); // 编译错误！
}

// 函数借用一个 String，不获取所有权
fn calculate_length(s: &String) -> usize {
    // s 是对 String 的引用
    s.len()
} // s 离开作用域，但因为它是借用，所以不会 drop 原值

// 函数通过可变引用修改 String
fn change_string(s: &mut String) {
    s.push_str(", world");
}

// 下面的函数会编译错误（取消注释试试）
// fn dangle() -> &String {
//     let s = String::from("hello");
//     &s  // 返回指向局部变量的引用
// } // s 被释放，引用变成悬垂指针
