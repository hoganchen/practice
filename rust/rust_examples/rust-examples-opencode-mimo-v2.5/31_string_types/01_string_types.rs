// ============================================
// 知识点：String 与 &str 详解
// 难度：中级
// ============================================

// Rust 有两种主要的字符串类型：
// 1. String：可增长、堆分配、UTF-8 编码
// 2. &str：字符串切片，引用已有数据

fn main() {
    // ==================== String 类型 ====================
    println!("=== String 类型 ===");
    
    // 创建 String
    let s1 = String::new();
    let s2 = String::from("hello");
    let s3 = "world".to_string();
    let s4 = "rust".to_owned();
    
    println!("s1: '{}'", s1);
    println!("s2: '{}'", s2);
    println!("s3: '{}'", s3);
    println!("s4: '{}'", s4);
    
    // String 操作
    let mut s = String::from("Hello");
    s.push_str(", World!");  // 追加字符串
    s.push('!');  // 追加字符
    println!("追加后: {}", s);
    
    // 插入
    s.insert(5, ',');
    println!("插入后: {}", s);
    
    s.insert_str(0, "Say: ");
    println!("插入字符串后: {}", s);
    
    // 删除
    let mut s = String::from("Hello, World!");
    s.pop();  // 删除最后一个字符
    println!("pop 后: {}", s);
    
    s.truncate(5);  // 截断到指定长度
    println!("truncate 后: {}", s);
    
    s.clear();  // 清空
    println!("clear 后: '{}'", s);
    
    // ==================== &str 类型 ====================
    println!("\n=== &str 类型 ===");
    
    // 字符串字面量是 &str
    let s: &str = "Hello, World!";
    println!("&str: {}", s);
    
    // 从 String 获取 &str
    let string = String::from("Hello, Rust!");
    let slice: &str = &string[0..5];
    println!("切片: {}", slice);
    
    // 完整切片
    let full_slice: &str = &string[..];
    println!("完整切片: {}", full_slice);
    
    // ==================== String 与 &str 转换 ====================
    println!("\n=== String 与 &str 转换 ===");
    
    // &str -> String
    let s1: &str = "hello";
    let s2: String = s1.to_string();
    let s3: String = String::from(s1);
    let s4: String = s1.to_owned();
    
    println!("&str -> String: {}", s2);
    
    // String -> &str
    let s1 = String::from("hello");
    let s2: &str = &s1;
    let s3: &str = s1.as_str();
    
    println!("String -> &str: {}", s2);
    
    // ==================== 字符串连接 ====================
    println!("\n=== 字符串连接 ===");
    
    // 使用 + 运算符
    let s1 = String::from("Hello, ");
    let s2 = String::from("World!");
    let s3 = s1 + &s2;  // s1 被移动，s2 被借用
    println!("+ 运算符: {}", s3);
    // println!("{}", s1);  // 错误：s1 已被移动
    
    // 使用 format! 宏
    let s1 = String::from("Hello");
    let s2 = String::from("World");
    let s3 = format!("{}, {}!", s1, s2);
    println!("format!: {}", s3);
    println!("s1 仍然可用: {}", s1);
    
    // ==================== 字符串遍历 ====================
    println!("\n=== 字符串遍历 ===");
    
    let s = "Hello, 世界!";
    
    // 按字符遍历
    print!("字符: ");
    for c in s.chars() {
        print!("{} ", c);
    }
    println!();
    
    // 按字节遍历
    print!("字节: ");
    for b in s.bytes() {
        print!("{} ", b);
    }
    println!();
    
    // 带索引的遍历
    for (i, c) in s.char_indices() {
        println!("索引 {}: {}", i, c);
    }
    
    // ==================== 字符串查找 ====================
    println!("\n=== 字符串查找 ===");
    
    let s = "Hello, World!";
    
    // 查找子串
    println!("包含 'World': {}", s.contains("World"));
    println!("以 'Hello' 开头: {}", s.starts_with("Hello"));
    println!("以 '!' 结尾: {}", s.ends_with("!"));
    
    // 查找位置
    if let Some(pos) = s.find("World") {
        println!("'World' 的位置: {}", pos);
    }
    
    // ==================== 字符串分割 ====================
    println!("\n=== 字符串分割 ===");
    
    let csv = "apple,banana,cherry";
    let fruits: Vec<&str> = csv.split(',').collect();
    println!("分割: {:?}", fruits);
    
    let s = "Hello\nWorld\nRust";
    let lines: Vec<&str> = s.lines().collect();
    println!("行: {:?}", lines);
    
    // ==================== 字符串修剪 ====================
    println!("\n=== 字符串修剪 ===");
    
    let s = "  Hello, World!  ";
    println!("原始: '{}'", s);
    println!("trim: '{}'", s.trim());
    println!("trim_start: '{}'", s.trim_start());
    println!("trim_end: '{}'", s.trim_end());
    
    // ==================== 字符串替换 ====================
    println!("\n=== 字符串替换 ===");
    
    let s = "Hello, World!";
    let new_s = s.replace("World", "Rust");
    println!("replace: {}", new_s);
    
    let s = "aaa bbb aaa ccc aaa";
    let new_s = s.replacen("aaa", "xxx", 2);  // 只替换前2个
    println!("replacen: {}", new_s);
    
    // ==================== 字符串大小写 ====================
    println!("\n=== 字符串大小写 ===");
    
    let s = "Hello, World!";
    println!("大写: {}", s.to_uppercase());
    println!("小写: {}", s.to_lowercase());
    
    // ==================== 字符串填充 ====================
    println!("\n=== 字符串填充 ===");
    
    let s = "42";
    println!("左填充: {:>10}", s);
    println!("右填充: {:<10}", s);
    println!("居中: {:^10}", s);
    println!("用0填充: {:0>5}", s);
    
    // ==================== 字符串与数字转换 ====================
    println!("\n=== 字符串与数字转换 ===");
    
    // 字符串 -> 数字
    let n: i32 = "42".parse().unwrap();
    let f: f64 = "3.14".parse().unwrap();
    println!("字符串 -> 数字: {} {}", n, f);
    
    // 数字 -> 字符串
    let s = (42).to_string();
    let s = format!("{}", 3.14);
    println!("数字 -> 字符串: {}", s);
    
    // ==================== 字符串内存布局 ====================
    println!("\n=== 字符串内存布局 ===");
    
    println!("String 大小: {} 字节", std::mem::size_of::<String>());
    println!("&str 大小: {} 字节", std::mem::size_of::<&str>());
    
    // String 包含：指针、长度、容量
    let s = String::from("Hello");
    println!("String 容量: {}", s.capacity());
    println!("String 长度: {}", s.len());
    
    // ==================== 字符串性能 ====================
    println!("\n=== 字符串性能 ===");
    
    // 预分配容量
    let mut s = String::with_capacity(100);
    for i in 0..100 {
        s.push_str("a");
    }
    println!("预分配字符串长度: {}", s.len());
    
    // 使用 collect 构建字符串
    let s: String = (0..100).map(|i| i.to_string()).collect();
    println!("collect 字符串长度: {}", s.len());
    
    // ==================== 字符串与 UTF-8 ====================
    println!("\n=== 字符串与 UTF-8 ===");
    
    let s = "Hello, 世界! 🦀";
    println!("UTF-8 字符串: {}", s);
    println!("字符数: {}", s.chars().count());
    println!("字节数: {}", s.len());
    
    // 验证 UTF-8
    let valid = String::from("Hello");
    let bytes = valid.as_bytes();
    println!("字节: {:?}", bytes);
    
    println!("\nString 与 &str 演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_string_types.rs -o 01_string_types.exe
//   01_string_types.exe
//
// Linux/macOS:
//   rustc 01_string_types.rs -o 01_string_types
//   ./01_string_types
// ============================================
