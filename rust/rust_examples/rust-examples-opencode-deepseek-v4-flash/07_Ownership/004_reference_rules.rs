// ============================================================
// Rust 知识点：引用规则详解 —— 借用检查器工作示例
// 编译：rustc 004_reference_rules.rs && .\004_reference_rules.exe
// ============================================================

fn main() {
    // ---- 规则 1：多个不可变引用可以同时存在 ----
    let s = String::from("hello");

    let r1 = &s; // 不可变引用 #1
    let r2 = &s; // 不可变引用 #2 — 没问题
    println!("r1 = {}, r2 = {}", r1, r2);
    // r1 和 r2 作用域结束

    // ---- 规则 2：可变引用与不可变引用不能同时存在 ----
    let mut s2 = String::from("world");

    let r3 = &s2;
    let r4 = &s2;
    println!("r3 = {}, r4 = {}", r3, r4);
    // 不可变引用 r3, r4 的最后一次使用在此

    let r5 = &mut s2; // 可行：因为前面的不可变引用不再使用
    println!("r5 = {}", r5);

    // ---- 规则 3：同一时间只能有一个可变引用 ----
    let mut s3 = String::from("data");

    // let r6 = &mut s3;
    // let r7 = &mut s3; // 编译错误！不能同时有两个可变引用
    // println!("{}, {}", r6, r7);

    // ---- NLL（Non-Lexical Lifetimes） ----
    // Rust 使用 NLL 而非简单的作用域规则
    // 引用在最后一次使用后即视为"不再使用"

    let mut s4 = String::from("nll");

    let r8 = &s4;
    println!("{}", r8); // 最后一次使用 r8
    // r8 的作用域在这里结束（NLL）

    let r9 = &mut s4; // 没问题！
    println!("{}", r9);

    // ---- 引用的引用 ----
    let s5 = String::from("hello");
    let r10 = &s5;
    let r11 = &r10;   // 对引用的引用
    println!("{}", r11); // 自动解引用

    // ---- &str 和 String 的引用区别 ----
    let string_literal = "hello";      // &str（字符串切片）
    let string_obj = String::from("hello"); // String

    // &String 可以自动转为 &str（通过 Deref trait）
    fn print_str(s: &str) {
        println!("{}", s);
    }
    print_str(string_literal);  // 直接 &str
    print_str(&string_obj);     // &String 自动转为 &str
}
