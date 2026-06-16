// ============================================================
// Rust 知识点：布尔类型（bool）和字符类型（char）
// 编译：rustc 003_boolean_char.rs && .\003_boolean_char.exe
// ============================================================

fn main() {
    // ---- 布尔类型 bool ----
    // 两个值：true / false，占用 1 字节
    let is_rust_fun: bool = true;
    let is_difficult = false;

    // 布尔值可用于条件判断
    if is_rust_fun {
        println!("Rust 很有趣！");
    }

    // 类型转换：bool 不能隐式转为整数
    // let n = true as i32; // 允许显式转换
    println!("true as u8 = {}", true as u8);  // 1
    println!("false as u8 = {}", false as u8); // 0

    // ---- 字符类型 char ----
    // char 是 4 字节的 Unicode 标量值，可以表示任意 Unicode 字符
    let letter: char = 'A';      // 英文字母
    let emoji: char = '🦀';      // 表情符号（Rust 的吉祥物 —— 螃蟹！）
    let chinese: char = '中';    // 汉字
    let space: char = ' ';       // 空格

    // 注意 char 字面量用单引号，字符串用双引号
    println!("字符: {}, {}, {}, {}", letter, emoji, chinese, space);

    // char 支持各种方法
    println!("'A' 是字母？{}", 'A'.is_alphabetic());
    println!("'1' 是数字？{}", '1'.is_numeric());
    println!("'🦀' 的 Unicode 编码：U+{:04X}", '🦀' as u32);
}
