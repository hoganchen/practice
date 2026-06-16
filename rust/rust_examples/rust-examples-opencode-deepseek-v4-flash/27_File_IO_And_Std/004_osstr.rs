// ============================================================
// Rust 知识点：OsStr / OsString —— 与操作系统交互的字符串
// 编译：rustc 004_osstr.rs && .\004_osstr.exe
// ============================================================

use std::ffi::{OsStr, OsString};
use std::path::Path;

fn main() {
    // ---- OsStr/OsString 的用途 ----
    // 与系统调用交互时使用（文件路径、环境变量等）
    // 可以表示非 UTF-8 字符串（Unix 上路径可以是任意字节）

    // ---- 创建 OsString ----
    let mut os_string = OsString::new();
    os_string.push("C:\\Users");
    os_string.push("Alice");
    os_string.push("documents");

    println!("OsString: {:?}", os_string);
    println!("OsString to_str: {:?}", os_string.to_str()); // 可能失败

    // ---- &str 与 OsStr 的转换 ----
    // &str -> &OsStr（总是成功）
    let s: &str = "hello.txt";
    let os_str: &OsStr = OsStr::new(s);
    println!("&str -> OsStr: {:?}", os_str);

    // OsStr -> &str（可能失败，如果非 UTF-8）
    match os_str.to_str() {
        Some(s) => println!("OsStr -> &str: {}", s),
        None => println!("不是有效的 UTF-8"),
    }

    // ---- Path/PathBuf 内部使用 OsStr ----
    let path = Path::new("/tmp/file.txt");
    let parent = path.parent().unwrap();
    println!("Path parent: {:?}", parent);
    println!("Path as OsStr: {:?}", path.as_os_str());

    // ---- 环境变量返回 OsString ----
    use std::env;

    match env::var_os("PATH") {
        Some(val) => {
            println!("PATH 环境变量（OsString）: {:?}", val);
            // OsString -> String
            match val.into_string() {
                Ok(s) => println!("PATH 字符串: {}", s),
                Err(_) => println!("PATH 不是 UTF-8"),
            }
        }
        None => println!("PATH 未设置"),
    }

    // ---- 非 UTF-8 路径处理 ----
    fn list_directory<P: AsRef<Path>>(path: P) {
        let path = path.as_ref();
        match std::fs::read_dir(path) {
            Ok(entries) => {
                for entry in entries.flatten() {
                    // file_name() 返回 OsString
                    let name = entry.file_name();
                    println!("  文件: {:?}", name);

                    // 尝试转为 &str
                    if let Some(name_str) = name.to_str() {
                        println!("    UTF-8: {}", name_str);
                    }
                }
            }
            Err(e) => eprintln!("读取目录失败: {}", e),
        }
    }

    println!("\n当前目录文件:");
    let _ = list_directory(".");

    // ---- OsStr 的比较 ----
    let a = OsStr::new("A.txt");
    let b = OsStr::new("B.txt");
    println!("OsStr 比较: {:?}", a.cmp(b));

    // ---- OsStr 的 size ----
    println!("\nOsString 大小: {} 字节", std::mem::size_of::<OsString>());
    println!("OsStr 大小: {} 字节（DST, 胖指针）", std::mem::size_of::<&OsStr>());
}
