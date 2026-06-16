// ============================================================
// Rust 知识点：Path、环境变量、命令行参数
// 编译：rustc 002_path_env_args.rs && .\002_path_env_args.exe
// ============================================================

use std::env;
use std::path::Path;

fn main() {
    // ========== 命令行参数 ==========
    let args: Vec<String> = env::args().collect();
    println!("程序名: {}", args[0]);
    if args.len() > 1 {
        println!("参数: {:?}", &args[1..]);
    }

    // ========== 环境变量 ==========
    // 读取环境变量
    match env::var("PATH") {
        Ok(val) => println!("PATH 环境变量: {}", val),
        Err(e) => println!("无法读取 PATH: {}", e),
    }

    // 设置环境变量（仅影响当前进程）
    env::set_var("MY_VAR", "hello");
    println!("MY_VAR: {}", env::var("MY_VAR").unwrap());

    // 遍历所有环境变量
    println!("\n所有环境变量:");
    for (key, value) in env::vars().take(5) {
        println!("  {}: {}", key, value);
    }

    // ========== Path 操作 ==========
    let path = Path::new("C:\\Users\\Alice\\Documents\\file.rs");

    println!("\nPath 操作:");
    println!("路径: {}", path.display());
    println!("是否存在: {}", path.exists());
    println!("是文件: {}", path.is_file());
    println!("是目录: {}", path.is_dir());

    // 路径组件
    println!("父目录: {:?}", path.parent());
    println!("文件名: {:?}", path.file_name());
    println!("扩展名: {:?}", path.extension());
    println!("无扩展名: {:?}", path.file_stem());

    // 路径拼接
    let base = Path::new("C:\\Users");
    let full = base.join("Alice").join("Documents");
    println!("拼接路径: {}", full.display());

    // 路径转换为其他类型
    let path_str = path.to_str().unwrap();
    println!("转为 &str: {}", path_str);

    // ========== 当前工作目录 ==========
    let current_dir = env::current_dir().unwrap();
    println!("\n当前目录: {}", current_dir.display());

    // ========== 临时目录 ==========
    let temp_dir = env::temp_dir();
    println!("临时目录: {}", temp_dir.display());

    // ========== 进程 ID ==========
    println!("进程 ID: {}", std::process::id());
}
