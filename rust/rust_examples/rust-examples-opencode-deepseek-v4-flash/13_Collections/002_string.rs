// ============================================================
// Rust 知识点：String（可增长的 UTF-8 字符串）
// String 是堆分配的、可变的 UTF-8 编码字符串
// 编译：rustc 002_string.rs && .\002_string.exe
// ============================================================

fn main() {
    // ---- 创建 String ----
    let mut s1 = String::new();
    let s2 = String::from("hello");
    let s3 = "world".to_string();

    // ---- 追加内容 ----
    s1.push('H');           // 追加字符
    s1.push_str("ello");    // 追加字符串
    println!("s1 = {}", s1);

    // ---- 字符串拼接 ----
    // 方法1：+
    let s4 = s1 + ", " + &s2 + "!"; // s1 被移动
    println!("拼接: {}", s4);
    // println!("{}", s1); // s1 已被移动

    // 方法2：format! 宏（更灵活，不获取所有权）
    let s5 = String::from("foo");
    let s6 = String::from("bar");
    let combined = format!("{}-{}", s5, s6);
    println!("format! 拼接: {}", combined);
    println!("s5 和 s6 依然有效: {} {}", s5, s6);

    // ---- 字符串长度 ----
    let s = "你好世界";
    println!("字符串长度（字节数）: {}", s.len());    // 12（UTF-8 编码）
    println!("字符数: {}", s.chars().count());         // 4

    // ---- 索引访问（注意：String 不支持整数索引！） ----
    // let c = s[0]; // 编译错误！String 不支持直接索引
    // 原因：UTF-8 编码中一个字符可能占用多个字节

    // ---- 遍历字符串 ----
    // 遍历字符
    print!("chars(): ");
    for c in "你好".chars() {
        print!("{} ", c);
    }
    println!();

    // 遍历字节
    print!("bytes(): ");
    for b in "ABC".bytes() {
        print!("{} ", b);
    }
    println!();

    // ---- 字符串切片（需要谨慎使用） ----
    let hello = "你好世界";
    let slice = &hello[0..3]; // "你" 占 3 个字节
    println!("切片: {}", slice);

    // 如果切到字符中间会 panic
    // let bad = &hello[0..2]; // panic！不是完整字符边界

    // ---- 常用方法 ----
    let text = "  Hello, Rust World!  ";
    println!("trim: '{}'", text.trim());
    println!("to_uppercase: {}", text.to_uppercase());
    println!("contains 'Rust': {}", text.contains("Rust"));

    let words: Vec<&str> = text.trim().split(',').collect();
    println!("split: {:?}", words);

    // ---- 字符串和 &str 的转换 ----
    let s: String = String::from("hello");
    let s_ref: &str = &s;     // &String -> &str
    let s_ref2: &str = s.as_str(); // 另一种方式
}
