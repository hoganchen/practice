// ============================================================
// Rust 知识点：分离模块到不同文件
// 编译：rustc main.rs && .\main.exe
// 注意：编译器会自动查找 greeting.rs 或 greeting/mod.rs
// ============================================================

// 声明模块，编译器会在以下位置查找：
// 1. greeting.rs（同目录）
// 2. greeting/mod.rs（子目录，旧风格）
mod greeting;

// 多层模块
mod utils;

fn main() {
    // 使用 greeting 模块
    println!("{}", greeting::hello());
    println!("{}", greeting::farewell());

    // 使用 utils 模块
    println!("{}", utils::string::capitalize("hello"));
    println!("{}", utils::math::add(10, 20));
}
