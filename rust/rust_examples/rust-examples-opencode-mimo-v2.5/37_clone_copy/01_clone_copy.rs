// ============================================
// 知识点：Clone 和 Copy Trait
// 难度：中级
// ============================================

// Clone trait 允许显式复制值
// Copy trait 允许隐式复制值（按位复制）

fn main() {
    // ==================== 基础 Clone ====================
    println!("=== 基础 Clone ===");
    
    let s1 = String::from("hello");
    let s2 = s1.clone();  // 显式克隆
    
    println!("s1: {}", s1);
    println!("s2: {}", s2);
    
    // ==================== 基础 Copy ====================
    println!("\n=== 基础 Copy ===");
    
    let x = 5;
    let y = x;  // 隐式复制（Copy）
    
    println!("x: {}", x);
    println!("y: {}", y);
    
    // ==================== 自定义 Clone ====================
    println!("\n=== 自定义 Clone ===");
    
    #[derive(Debug, Clone)]
    struct Person {
        name: String,
        age: u32,
    }
    
    let person1 = Person {
        name: String::from("Alice"),
        age: 30,
    };
    
    let person2 = person1.clone();
    
    println!("person1: {:?}", person1);
    println!("person2: {:?}", person2);
    
    // ==================== 自定义 Copy ====================
    println!("\n=== 自定义 Copy ===");
    
    #[derive(Debug, Clone, Copy)]
    struct Point {
        x: f64,
        y: f64,
    }
    
    let p1 = Point { x: 1.0, y: 2.0 };
    let p2 = p1;  // 隐式复制
    
    println!("p1: {:?}", p1);
    println!("p2: {:?}", p2);
    
    // ==================== Clone vs Copy ====================
    println!("\n=== Clone vs Copy ===");
    
    // Copy 类型在赋值时自动复制
    let a = 42;
    let b = a;  // a 仍然有效
    
    println!("a: {}, b: {}", a, b);
    
    // Clone 类型在赋值时移动
    let s1 = String::from("hello");
    let s2 = s1;  // s1 被移动
    
    // println!("{}", s1);  // 错误：s1 已被移动
    println!("s2: {}", s2);
    
    // ==================== Copy 的要求 ====================
    println!("\n=== Copy 的要求 ===");
    
    // Copy 类型必须：
    // 1. 实现 Clone trait
    // 2. 所有字段都是 Copy 类型
    // 3. 不能实现 Drop trait
    
    #[derive(Debug, Clone, Copy)]
    struct Color {
        r: u8,
        g: u8,
        b: u8,
    }
    
    let c1 = Color { r: 255, g: 0, b: 0 };
    let c2 = c1;  // Copy
    
    println!("c1: {:?}", c1);
    println!("c2: {:?}", c2);
    
    // ==================== Clone 与性能 ====================
    println!("\n=== Clone 与性能 ===");
    
    // 深拷贝 vs 浅拷贝
    let v1 = vec![1, 2, 3, 4, 5];
    let v2 = v1.clone();  // 深拷贝
    
    println!("v1: {:?}", v1);
    println!("v2: {:?}", v2);
    
    // ==================== Clone 与智能指针 ====================
    println!("\n=== Clone 与智能指针 ===");
    
    use std::rc::Rc;
    use std::sync::Arc;
    
    // Rc::clone 是浅拷贝（增加引用计数）
    let rc1 = Rc::new(String::from("hello"));
    let rc2 = Rc::clone(&rc1);
    
    println!("rc1: {}", rc1);
    println!("rc2: {}", rc2);
    println!("引用计数: {}", Rc::strong_count(&rc1));
    
    // Arc::clone 也是浅拷贝
    let arc1 = Arc::new(vec![1, 2, 3]);
    let arc2 = Arc::clone(&arc1);
    
    println!("arc1: {:?}", arc1);
    println!("arc2: {:?}", arc2);
    
    // ==================== Clone 与 Option ====================
    println!("\n=== Clone 与 Option ===");
    
    let opt1: Option<i32> = Some(42);
    let opt2: Option<i32> = opt1.clone();
    
    println!("opt1: {:?}", opt1);
    println!("opt2: {:?}", opt2);
    
    // ==================== Clone 与 Result ====================
    println!("\n=== Clone 与 Result ===");
    
    let result1: Result<i32, String> = Ok(42);
    let result2: Result<i32, String> = result1.clone();
    
    println!("result1: {:?}", result1);
    println!("result2: {:?}", result2);
    
    // ==================== Clone 与集合 ====================
    println!("\n=== Clone 与集合 ===");
    
    use std::collections::HashMap;
    
    let mut map1 = HashMap::new();
    map1.insert("key1", "value1");
    map1.insert("key2", "value2");
    
    let map2 = map1.clone();
    
    println!("map1: {:?}", map1);
    println!("map2: {:?}", map2);
    
    // ==================== Clone 与结构体 ====================
    println!("\n=== Clone 与结构体 ===");
    
    #[derive(Debug, Clone)]
    struct Config {
        name: String,
        values: Vec<String>,
        nested: Option<Box<Config>>,
    }
    
    let config1 = Config {
        name: String::from("主配置"),
        values: vec!["a".to_string(), "b".to_string()],
        nested: Some(Box::new(Config {
            name: String::from("子配置"),
            values: vec!["c".to_string()],
            nested: None,
        })),
    };
    
    let config2 = config1.clone();
    
    println!("config1: {:#?}", config1);
    println!("config2: {:#?}", config2);
    
    // ==================== Copy 的性能 ====================
    println!("\n=== Copy 的性能 ===");
    
    // Copy 类型在栈上复制，非常快
    let start = std::time::Instant::now();
    
    let mut sum = 0i32;
    for _ in 0..1000000 {
        let x = 42i32;
        let y = x;  // Copy
        sum += y;
    }
    
    let duration = start.elapsed();
    println!("Copy 性能: {:?} (sum: {})", duration, sum);
    
    // ==================== Clone 的性能 ====================
    println!("\n=== Clone 的性能 ===");
    
    let start = std::time::Instant::now();
    
    let mut sum = 0usize;
    for _ in 0..1000 {
        let v = vec![1, 2, 3, 4, 5];
        let v2 = v.clone();  // Clone
        sum += v2.len();
    }
    
    let duration = start.elapsed();
    println!("Clone 性能: {:?} (sum: {})", duration, sum);
    
    // ==================== 实际应用 ====================
    println!("\n=== 实际应用 ===");
    
    // 使用 Clone 进行备份
    #[derive(Debug, Clone)]
    struct Database {
        records: Vec<String>,
    }
    
    impl Database {
        fn new() -> Self {
            Database {
                records: Vec::new(),
            }
        }
        
        fn add(&mut self, record: &str) {
            self.records.push(record.to_string());
        }
        
        fn backup(&self) -> Self {
            self.clone()
        }
    }
    
    let mut db = Database::new();
    db.add("记录 1");
    db.add("记录 2");
    
    let backup = db.backup();
    
    println!("原始数据库: {:?}", db);
    println!("备份数据库: {:?}", backup);
    
    println!("\nClone 和 Copy Trait 演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_clone_copy.rs -o 01_clone_copy.exe
//   01_clone_copy.exe
//
// Linux/macOS:
//   rustc 01_clone_copy.rs -o 01_clone_copy
//   ./01_clone_copy
// ============================================
