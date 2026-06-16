// ============================================================
// Rust 知识点：文件读写 —— std::fs 和 std::io
// 编译：rustc 001_file_read_write.rs && .\001_file_read_write.exe
// ============================================================

use std::fs::{self, File};
use std::io::{self, BufRead, BufReader, Write};

fn main() -> io::Result<()> {
    // ---- 写入文件 ----
    // 方法1：write! 宏
    let mut file = File::create("temp_files/example.txt")?;
    write!(file, "Hello, Rust 文件系统！\n")?;
    writeln!(file, "这是第二行")?;
    writeln!(file, "这是第三行")?;

    // 方法2：write_all（字节数据）
    file.write_all("二进制数据\n".as_bytes())?;

    // file 在此处 drop，自动关闭

    // ---- 读取文件 ----
    // 方法1：全部读入 String
    let content = fs::read_to_string("temp_files/example.txt")?;
    println!("=== 全部内容 ===");
    println!("{}", content);

    // 方法2：逐行读取
    println!("=== 逐行读取 ===");
    let file = File::open("temp_files/example.txt")?;
    let reader = BufReader::new(file);
    for (index, line) in reader.lines().enumerate() {
        let line = line?;
        println!("第{}行: {}", index + 1, line);
    }

    // 方法3：读取为字节
    let bytes = fs::read("temp_files/example.txt")?;
    println!("字节数: {}", bytes.len());

    // ---- 追加写入 ----
    let mut file = fs::OpenOptions::new()
        .append(true)
        .open("temp_files/example.txt")?;
    writeln!(file, "追加的一行")?;

    // ---- 检查文件是否存在 ----
    println!("文件存在: {}", fs::metadata("temp_files/example.txt").is_ok());

    // ---- 创建目录 ----
    fs::create_dir_all("temp_files/subdir")?;

    // ---- 列出目录 ----
    println!("\n=== 列出目录 ===");
    for entry in fs::read_dir("temp_files")? {
        let entry = entry?;
        let path = entry.path();
        println!("  {}", path.display());
    }

    // ---- 复制文件 ----
    fs::copy("temp_files/example.txt", "temp_files/example_copy.txt")?;

    // ---- 删除文件 ----
    fs::remove_file("temp_files/example_copy.txt")?;

    // ---- 删除目录 ----
    fs::remove_dir("temp_files/subdir")?;

    // 清理
    fs::remove_file("temp_files/example.txt")?;
    fs::remove_dir("temp_files")?;

    Ok(())
}
