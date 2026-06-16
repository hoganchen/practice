// ============================================
// 知识点：Cow (Clone on Write)
// 难度：中级
// ============================================

// Cow 是一个枚举，可以包含 borrowed 或 owned 数据
// 用于避免不必要的克隆

use std::borrow::Cow;

fn main() {
    // ==================== 基础 Cow ====================
    println!("=== 基础 Cow ===");
    
    // 借用的数据
    let s: Cow<str> = Cow::Borrowed("hello");
    println!("借用: {}", s);
    
    // 拥有的数据
    let s: Cow<str> = Cow::Owned(String::from("world"));
    println!("拥有: {}", s);
    
    // ==================== Cow 与字符串操作 ====================
    println!("\n=== Cow 与字符串操作 ===");
    
    fn ensure_suffix(s: &str) -> Cow<str> {
        if s.ends_with("!") {
            Cow::Borrowed(s)  // 不需要修改，借用
        } else {
            Cow::Owned(format!("{}!", s))  // 需要修改，拥有
        }
    }
    
    let s1 = "hello";
    let s2 = "world!";
    
    let result1 = ensure_suffix(s1);
    let result2 = ensure_suffix(s2);
    
    println!("{} -> {}", s1, result1);
    println!("{} -> {}", s2, result2);
    
    // ==================== Cow 与条件克隆 ====================
    println!("\n=== Cow 与条件克隆 ===");
    
    fn to_uppercase_if_needed(s: &str) -> Cow<str> {
        if s.chars().any(|c| c.is_lowercase()) {
            Cow::Owned(s.to_uppercase())  // 需要转换
        } else {
            Cow::Borrowed(s)  // 已经是大写
        }
    }
    
    let s1 = "hello";
    let s2 = "HELLO";
    
    let result1 = to_uppercase_if_needed(s1);
    let result2 = to_uppercase_if_needed(s2);
    
    println!("{} -> {}", s1, result1);
    println!("{} -> {}", s2, result2);
    
    // ==================== Cow 与解析 ====================
    println!("\n=== Cow 与解析 ===");
    
    fn parse_number(s: &str) -> Cow<str> {
        match s.parse::<i32>() {
            Ok(n) => Cow::Owned(format!("数字: {}", n)),
            Err(_) => Cow::Borrowed(s),
        }
    }
    
    let inputs = vec!["42", "abc", "123", "xyz"];
    
    for input in inputs {
        let result = parse_number(input);
        println!("{} -> {}", input, result);
    }
    
    // ==================== Cow 与编码 ====================
    println!("\n=== Cow 与编码 ===");
    
    fn encode_html(s: &str) -> Cow<str> {
        let mut needs_encoding = false;
        
        for c in s.chars() {
            match c {
                '&' | '<' | '>' | '"' | '\'' => {
                    needs_encoding = true;
                    break;
                }
                _ => {}
            }
        }
        
        if !needs_encoding {
            return Cow::Borrowed(s);
        }
        
        let mut result = String::with_capacity(s.len() * 2);
        for c in s.chars() {
            match c {
                '&' => result.push_str("&amp;"),
                '<' => result.push_str("&lt;"),
                '>' => result.push_str("&gt;"),
                '"' => result.push_str("&quot;"),
                '\'' => result.push_str("&#39;"),
                _ => result.push(c),
            }
        }
        
        Cow::Owned(result)
    }
    
    let inputs = vec!["hello", "a < b", "a & b", "\"quoted\""];
    
    for input in inputs {
        let result = encode_html(input);
        println!("{} -> {}", input, result);
    }
    
    // ==================== Cow 与内存效率 ====================
    println!("\n=== Cow 与内存效率 ===");
    
    // 不使用 Cow
    fn process_without_cow(s: &str) -> String {
        format!("处理: {}", s)
    }
    
    // 使用 Cow
    fn process_with_cow(s: &str) -> Cow<str> {
        Cow::Owned(format!("处理: {}", s))
    }
    
    let s = "hello";
    
    let result1 = process_without_cow(s);
    let result2 = process_with_cow(s);
    
    println!("不使用 Cow: {}", result1);
    println!("使用 Cow: {}", result2);
    
    // ==================== Cow 与集合 ====================
    println!("\n=== Cow 与集合 ===");
    
    fn filter_strings<'a>(items: &'a [&str]) -> Vec<Cow<'a, str>> {
        items
            .iter()
            .map(|s| {
                if s.len() > 5 {
                    Cow::Borrowed(*s)
                } else {
                    Cow::Owned(s.to_uppercase())
                }
            })
            .collect()
    }
    
    let items = vec!["hello", "hi", "world", "ok"];
    let results = filter_strings(&items);
    
    for result in &results {
        println!("{}", result);
    }
    
    // ==================== Cow 与模式匹配 ====================
    println!("\n=== Cow 与模式匹配 ===");
    
    fn normalize(s: &str) -> Cow<str> {
        match s {
            s if s.is_empty() => Cow::Borrowed("(empty)"),
            s if s.chars().all(|c| c.is_numeric()) => {
                Cow::Owned(format!("num:{}", s))
            }
            s if s.len() > 10 => {
                Cow::Owned(format!("{}...", &s[..10]))
            }
            _ => Cow::Borrowed(s),
        }
    }
    
    let inputs = vec!["", "123", "hello world", "short"];
    
    for input in inputs {
        let result = normalize(input);
        println!("'{}' -> '{}'", input, result);
    }
    
    // ==================== Cow 与迭代器 ====================
    println!("\n=== Cow 与迭代器 ===");
    
    let words = vec!["hello", "world", "rust"];
    
    let result: Vec<Cow<str>> = words
        .iter()
        .map(|w| {
            if w.len() > 4 {
                Cow::Borrowed(*w)
            } else {
                Cow::Owned(format!("[{}]", w))
            }
        })
        .collect();
    
    for item in &result {
        println!("{}", item);
    }
    
    // ==================== Cow 与错误处理 ====================
    println!("\n=== Cow 与错误处理 ===");
    
    fn validate_input(s: &str) -> Cow<str> {
        if s.is_empty() {
            Cow::Borrowed("错误: 输入为空")
        } else if s.len() > 100 {
            Cow::Borrowed("错误: 输入过长")
        } else if !s.chars().all(|c| c.is_alphanumeric()) {
            Cow::Owned(format!("警告: 包含非字母数字字符: {}", s))
        } else {
            Cow::Borrowed("有效输入")
        }
    }
    
    let inputs = vec!["", "hello", "hello@world", "a".repeat(200).as_str()];
    
    for input in inputs {
        let result = validate_input(input);
        println!("验证 '{}': {}", input, result);
    }
    
    // ==================== 实际应用 ====================
    println!("\n=== 实际应用 ===");
    
    // 路径处理
    fn ensure_extension<'a>(path: &'a str, ext: &str) -> Cow<'a, str> {
        if path.ends_with(ext) {
            Cow::Borrowed(path)
        } else {
            Cow::Owned(format!("{}.{}", path, ext))
        }
    }
    
    let paths = vec!["file.txt", "document", "image.png"];
    
    for path in paths {
        let result = ensure_extension(path, ".txt");
        println!("{} -> {}", path, result);
    }
    
    // 日志格式化
    fn format_log<'a>(level: &str, message: &'a str) -> Cow<'a, str> {
        if level == "DEBUG" {
            Cow::Borrowed(message)
        } else {
            Cow::Owned(format!("[{}] {}", level, message))
        }
    }
    
    let messages = vec![("INFO", "系统启动"), ("DEBUG", "调试信息"), ("ERROR", "发生错误")];
    
    for (level, msg) in messages {
        let result = format_log(level, msg);
        println!("{}", result);
    }
    
    println!("\nCow (Clone on Write) 演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_cow.rs -o 01_cow.exe
//   01_cow.exe
//
// Linux/macOS:
//   rustc 01_cow.rs -o 01_cow
//   ./01_cow
// ============================================
