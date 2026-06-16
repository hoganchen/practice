// ============================================
// 知识点：Hello World 程序
// 难度：入门
// ============================================

// Rust 程序的入口点是 main 函数
// 使用 println! 宏来输出文本到控制台
// 每个 Rust 程序都从 main 函数开始执行

fn main() {
    // println! 是一个宏（注意后面的!），用于格式化输出
    // 它会在输出后自动换行
    println!("Hello, World!");
    
    // 输出空行
    println!();
    
    // 输出带有变量的文本
    let name = "Rust";
    let version = 1.95;
    println!("欢迎学习 {} {} 版本!", name, version);
    
    // 使用格式化占位符
    println!("数字: {}", 42);
    println!("浮点数: {:.2}", 3.14159);
    println!("布尔值: {}", true);
    
    // 多个占位符
    let x = 10;
    let y = 20;
    println!("{} + {} = {}", x, y, x + y);
    
    // 使用命名参数
    println!("{name} 是一种系统编程语言", name = "Rust");
    
    // 输出到标准错误流（不换行）
    eprint!("这是一个错误信息");
    eprintln!("（换行后）");
    
    // 使用 dbg! 宏调试输出（输出到 stderr，包含文件名和行号）
    dbg!(x + y);
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_hello_world.rs -o 01_hello_world.exe
//   01_hello_world.exe
//
// Linux/macOS:
//   rustc 01_hello_world.rs -o 01_hello_world
//   ./01_hello_world
//
// 或者使用 cargo（推荐）：
//   cargo run --example 01_hello_world
// ============================================
