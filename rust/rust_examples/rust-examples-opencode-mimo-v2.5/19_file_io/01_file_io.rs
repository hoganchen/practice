// ============================================
// 知识点：文件 I/O
// 难度：中级
// ============================================

// Rust 标准库提供了文件操作功能
// 使用 std::fs 和 std::io 模块

use std::fs;
use std::io::{self, BufRead, BufReader, BufWriter, Read, Write};
use std::path::Path;

fn main() {
    // ==================== 文件读取 ====================
    println!("=== 文件读取 ===");
    
    // 读取整个文件到字符串
    match fs::read_to_string("test_input.txt") {
        Ok(content) => println!("文件内容:\n{}", content),
        Err(e) => println!("读取失败（文件可能不存在）: {}", e),
    }
    
    // 读取文件到字节数组
    match fs::read("test_input.txt") {
        Ok(bytes) => println!("字节数: {}", bytes.len()),
        Err(e) => println!("读取失败: {}", e),
    }
    
    // ==================== 文件写入 ====================
    println!("\n=== 文件写入 ===");
    
    // 写入字符串到文件
    let content = "Hello, Rust!\n这是第二行\n这是第三行\n";
    match fs::write("test_output.txt", content) {
        Ok(_) => println!("文件写入成功"),
        Err(e) => println!("写入失败: {}", e),
    }
    
    // ==================== 文件追加 ====================
    println!("\n=== 文件追加 ===");
    
    use std::fs::OpenOptions;
    
    let mut file = OpenOptions::new()
        .append(true)
        .open("test_output.txt")
        .unwrap();
    
    writeln!(file, "追加的内容").unwrap();
    println!("内容已追加");
    
    // ==================== 使用 BufReader ====================
    println!("\n=== 使用 BufReader ===");
    
    if let Ok(file) = fs::File::open("test_output.txt") {
        let reader = BufReader::new(file);
        
        for (index, line) in reader.lines().enumerate() {
            match line {
                Ok(line) => println!("第 {} 行: {}", index + 1, line),
                Err(e) => println!("读取行失败: {}", e),
            }
        }
    }
    
    // ==================== 使用 BufWriter ====================
    println!("\n=== 使用 BufWriter ===");
    
    if let Ok(file) = fs::File::create("test_buffered.txt") {
        let mut writer = BufWriter::new(file);
        
        for i in 0..5 {
            writeln!(writer, "行 {}: 这是缓冲写入", i + 1).unwrap();
        }
        
        // 确保所有内容都写入文件
        writer.flush().unwrap();
        println!("缓冲写入完成");
    }
    
    // ==================== 文件元数据 ====================
    println!("\n=== 文件元数据 ===");
    
    if let Ok(metadata) = fs::metadata("test_output.txt") {
        println!("文件大小: {} 字节", metadata.len());
        println!("是否为文件: {}", metadata.is_file());
        println!("是否为目录: {}", metadata.is_dir());
        println!("是否只读: {}", metadata.permissions().readonly());
        
        if let Ok(modified) = metadata.modified() {
            println!("最后修改时间: {:?}", modified);
        }
    }
    
    // ==================== 目录操作 ====================
    println!("\n=== 目录操作 ===");
    
    // 创建目录
    fs::create_dir_all("test_dir/subdir").unwrap();
    println!("目录已创建");
    
    // 列出目录内容
    if let Ok(entries) = fs::read_dir(".") {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                let file_type = entry.file_type().unwrap();
                println!(
                    "{}: {}",
                    if file_type.is_dir() { "目录" } else { "文件" },
                    path.display()
                );
            }
        }
    }
    
    // ==================== 文件路径操作 ====================
    println!("\n=== 文件路径操作 ===");
    
    let path = Path::new("test_dir/file.txt");
    
    println!("路径: {}", path.display());
    println!("文件名: {:?}", path.file_name());
    println!("扩展名: {:?}", path.extension());
    println!("父目录: {:?}", path.parent());
    println!("是否为绝对路径: {}", path.is_absolute());
    
    // 路径拼接
    let base = Path::new("/usr");
    let full = base.join("local").join("bin");
    println!("拼接路径: {}", full.display());
    
    // ==================== 文件搜索 ====================
    println!("\n=== 文件搜索 ===");
    
    // 查找所有 .txt 文件
    if let Ok(entries) = fs::read_dir(".") {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("txt") {
                    println!("找到 txt 文件: {}", path.display());
                }
            }
        }
    }
    
    // ==================== 临时文件 ====================
    println!("\n=== 临时文件 ===");
    
    // 创建临时文件
    let temp_file = std::env::temp_dir().join("rust_temp.txt");
    fs::write(&temp_file, "临时内容").unwrap();
    println!("临时文件已创建: {}", temp_file.display());
    
    // 清理临时文件
    fs::remove_file(&temp_file).unwrap();
    println!("临时文件已删除");
    
    // ==================== 文件权限 ====================
    println!("\n=== 文件权限 ===");
    
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        
        if let Ok(metadata) = fs::metadata("test_output.txt") {
            let permissions = metadata.permissions();
            println!("权限模式: {:o}", permissions.mode());
        }
    }
    
    // ==================== 文件锁定（模拟） ====================
    println!("\n=== 文件锁定模拟 ===");
    
    // 在实际应用中，可以使用文件锁来防止并发访问
    // 这里只是一个概念演示
    
    let lock_file = "test.lock";
    if !Path::new(lock_file).exists() {
        fs::write(lock_file, "").unwrap();
        println!("锁文件已创建");
        
        // 执行一些操作...
        
        // 释放锁
        fs::remove_file(lock_file).unwrap();
        println!("锁文件已删除");
    }
    
    // ==================== 错误处理 ====================
    println!("\n=== 错误处理 ===");
    
    fn read_file(path: &str) -> Result<String, io::Error> {
        let content = fs::read_to_string(path)?;
        Ok(content)
    }
    
    match read_file("test_output.txt") {
        Ok(content) => println!("读取成功: {} 字节", content.len()),
        Err(e) => println!("读取失败: {}", e),
    }
    
    match read_file("nonexistent.txt") {
        Ok(content) => println!("读取成功: {} 字节", content.len()),
        Err(e) => println!("读取失败: {}", e),
    }
    
    // ==================== 清理测试文件 ====================
    println!("\n=== 清理测试文件 ===");
    
    let files_to_remove = [
        "test_input.txt",
        "test_output.txt",
        "test_buffered.txt",
        "test_dir/subdir/file.txt",
        "test_dir/subdir",
        "test_dir",
    ];
    
    for file in &files_to_remove {
        if Path::new(file).exists() {
            if Path::new(file).is_dir() {
                fs::remove_dir(file).unwrap();
            } else {
                fs::remove_file(file).unwrap();
            }
            println!("已删除: {}", file);
        }
    }
    
    println!("\n文件 I/O 演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_file_io.rs -o 01_file_io.exe
//   01_file_io.exe
//
// Linux/macOS:
//   rustc 01_file_io.rs -o 01_file_io
//   ./01_file_io
// ============================================
