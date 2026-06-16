// ============================================
// 知识点：AsRef/AsMut Trait
// 难度：中级
// ============================================

// AsRef 和 AsMut 用于创建接受多种引用类型的函数
// 它们提供了一种通用的方式来引用不同类型的数据

fn main() {
    // ==================== 基础 AsRef ====================
    println!("=== 基础 AsRef ===");
    
    // String 实现了 AsRef<str>
    let s = String::from("hello");
    let r: &str = s.as_ref();
    println!("String -> &str: {}", r);
    
    // &str 也实现了 AsRef<str>
    let r: &str = "world";
    let r2: &str = r.as_ref();
    println!("&str -> &str: {}", r2);
    
    // ==================== AsRef 与函数参数 ====================
    println!("\n=== AsRef 与函数参数 ===");
    
    fn print_ref(s: impl AsRef<str>) {
        println!("值: {}", s.as_ref());
    }
    
    let s = String::from("Hello");
    print_ref(&s);  // String
    
    print_ref("World");  // &str
    
    // ==================== AsRef 与集合 ====================
    println!("\n=== AsRef 与集合 ===");
    
    fn contains_word(text: impl AsRef<str>, word: &str) -> bool {
        text.as_ref().contains(word)
    }
    
    let text = String::from("Hello, World!");
    println!("包含 'World': {}", contains_word(&text, "World"));
    println!("包含 'Rust': {}", contains_word("Hello, Rust!", "Rust"));
    
    // ==================== 基础 AsMut ====================
    println!("\n=== 基础 AsMut ===");
    
    fn append_exclamation(s: impl AsMut<String>) {
        s.as_mut().push_str("!");
    }
    
    let mut s = String::from("Hello");
    append_exclamation(&mut s);
    println!("追加后: {}", s);
    
    // ==================== AsRef 与路径 ====================
    println!("\n=== AsRef 与路径 ===");
    
    use std::path::Path;
    
    fn check_path(path: impl AsRef<Path>) {
        let path = path.as_ref();
        println!("路径: {}", path.display());
        println!("是绝对路径: {}", path.is_absolute());
    }
    
    check_path("/usr/local/bin");
    check_path(Path::new("relative/path"));
    
    // ==================== AsRef 与迭代器 ====================
    println!("\n=== AsRef 与迭代器 ===");
    
    fn find_longest_word(text: impl AsRef<str>) -> Option<&str> {
        text.as_ref()
            .split_whitespace()
            .max_by_key(|word| word.len())
    }
    
    let text = String::from("The quick brown fox jumps");
    println!("最长单词: {:?}", find_longest_word(&text));
    
    // ==================== AsRef 与错误处理 ====================
    println!("\n=== AsRef 与错误处理 ===");
    
    fn read_config(path: impl AsRef<std::path::Path>) -> Result<String, std::io::Error> {
        std::fs::read_to_string(path.as_ref())
    }
    
    match read_config("/etc/hostname") {
        Ok(content) => println!("配置: {}", content.trim()),
        Err(e) => println!("读取失败: {}", e),
    }
    
    // ==================== AsRef 与字符串操作 ====================
    println!("\n=== AsRef 与字符串操作 ===");
    
    fn to_uppercase(s: impl AsRef<str>) -> String {
        s.as_ref().to_uppercase()
    }
    
    let s = String::from("hello");
    println!("大写: {}", to_uppercase(&s));
    println!("大写: {}", to_uppercase("world"));
    
    // ==================== AsRef 与模式匹配 ====================
    println!("\n=== AsRef 与模式匹配 ===");
    
    fn is_numeric(s: impl AsRef<str>) -> bool {
        s.as_ref().chars().all(|c| c.is_numeric())
    }
    
    println!("'123' 是数字: {}", is_numeric("123"));
    println!("'abc' 是数字: {}", is_numeric("abc"));
    println!("'12a3' 是数字: {}", is_numeric("12a3"));
    
    // ==================== AsRef 与文件操作 ====================
    println!("\n=== AsRef 与文件操作 ===");
    
    fn write_to_file(path: impl AsRef<std::path::Path>, content: &str) -> std::io::Result<()> {
        std::fs::write(path.as_ref(), content)
    }
    
    match write_to_file("test_as_ref.txt", "Hello, AsRef!") {
        Ok(()) => println!("文件写入成功"),
        Err(e) => println!("写入失败: {}", e),
    }
    
    // ==================== AsRef 与类型转换 ====================
    println!("\n=== AsRef 与类型转换 ===");
    
    struct MyString(String);
    
    impl AsRef<str> for MyString {
        fn as_ref(&self) -> &str {
            &self.0
        }
    }
    
    let my_string = MyString(String::from("custom string"));
    print_ref(&my_string);
    
    // ==================== AsRef 与性能 ====================
    println!("\n=== AsRef 与性能 ===");
    
    // AsRef 避免不必要的分配
    fn process_large_string(s: impl AsRef<str>) -> usize {
        s.as_ref().len()
    }
    
    let large_string = "a".repeat(1000000);
    println!("字符串长度: {}", process_large_string(&large_string));
    
    // ==================== 实际应用 ====================
    println!("\n=== 实际应用 ===");
    
    // 数据库查询
    fn execute_query(sql: impl AsRef<str>) -> Vec<String> {
        let sql = sql.as_ref();
        println!("执行 SQL: {}", sql);
        vec!["result1".to_string(), "result2".to_string()]
    }
    
    let query = String::from("SELECT * FROM users");
    let results = execute_query(&query);
    println!("结果: {:?}", results);
    
    // 配置解析
    fn parse_config(content: impl AsRef<str>) -> std::collections::HashMap<String, String> {
        let mut config = std::collections::HashMap::new();
        for line in content.as_ref().lines() {
            if let Some((key, value)) = line.split_once('=') {
                config.insert(key.trim().to_string(), value.trim().to_string());
            }
        }
        config
    }
    
    let config_content = "host=localhost\nport=8080\ndebug=true";
    let config = parse_config(config_content);
    println!("配置: {:?}", config);
    
    println!("\nAsRef/AsMut Trait 演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_as_ref.rs -o 01_as_ref.exe
//   01_as_ref.exe
//
// Linux/macOS:
//   rustc 01_as_ref.rs -o 01_as_ref
//   ./01_as_ref
// ============================================
