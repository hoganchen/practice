// ============================================================
// Rust 知识点：共享引用（&T）vs 可变引用（&mut T）
// 编译：rustc 001_shared_vs_mutable.rs && .\001_shared_vs_mutable.exe
// ============================================================

// ---- 函数：使用共享引用（只读） ----
fn read_only(s: &String) {
    println!("只读访问: {}", s);
}

// ---- 函数：使用可变引用（读写） ----
fn write(s: &mut String) {
    s.push_str(" 添加的内容");
    println!("写入后: {}", s);
}

fn main() {
    // ---- 共享引用 &T ----
    // 可以有多个 &T 引用同时存在
    let s = String::from("hello");

    let ref1 = &s;
    let ref2 = &s;
    let ref3 = &s;

    println!("ref1: {}, ref2: {}, ref3: {}", ref1, ref2, ref3);
    // 多个共享引用同时存在是允许的

    // 传入共享引用
    read_only(ref1);

    // ---- 可变引用 &mut T ----
    // 同一时间只能有一个 &mut T 引用
    let mut s2 = String::from("world");

    let mut_ref = &mut s2;
    // let mut_ref2 = &mut s2; // 编译错误！不能同时有两个可变引用
    // let shared_ref = &s2;    // 编译错误！可变引用和不可变引用不能共存

    write(mut_ref);
    // println!("{}", mut_ref); // NLL：最后一次使用后释放

    // 可变引用使用完后，又可以有不可变引用
    let shared_ref2 = &s2; // 现在可以了
    println!("shared_ref2: {}", shared_ref2);

    // ---- 引用作用域（NLL） ----
    let mut data = String::from("data");

    let r1 = &data;
    let r2 = &data;
    println!("{}, {}", r1, r2); // r1, r2 在此之后不再使用

    let r3 = &mut data; // 可行：r1, r2 已不再使用
    r3.push_str(" modified");
    println!("{}", r3);

    // ---- 引用作为函数参数 ----
    fn first_word(s: &str) -> &str {
        s.split_whitespace().next().unwrap_or("")
    }
    let text = String::from("hello world");
    let word = first_word(&text);
    println!("first word: {}", word);
}
