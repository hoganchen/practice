// ============================================
// 知识点：Deref 强制转换
// 难度：高级
// ============================================

// Deref trait 允许自定义解引用操作符的行为
// Deref 强制转换使得智能指针可以像引用一样使用

use std::ops::{Deref, DerefMut};
use std::rc::Rc;

fn main() {
    // ==================== 基础 Deref ====================
    println!("=== 基础 Deref ===");
    
    struct MyBox<T>(T);
    
    impl<T> MyBox<T> {
        fn new(x: T) -> MyBox<T> {
            MyBox(x)
        }
    }
    
    impl<T> Deref for MyBox<T> {
        type Target = T;
        
        fn deref(&self) -> &T {
            &self.0
        }
    }
    
    let x = MyBox::new(5);
    println!("MyBox 值: {}", *x);  // 解引用
    
    // ==================== Deref 强制转换 ====================
    println!("\n=== Deref 强制转换 ===");
    
    fn hello(name: &str) {
        println!("Hello, {}!", name);
    }
    
    let name = MyBox::new(String::from("Rust"));
    hello(&name);  // 自动解引用: &MyBox<String> -> &String -> &str
    
    // ==================== 多重 Deref ====================
    println!("\n=== 多重 Deref ===");
    
    struct Wrapper<T>(T);
    
    impl<T> Deref for Wrapper<T> {
        type Target = T;
        
        fn deref(&self) -> &T {
            &self.0
        }
    }
    
    let wrapped = Wrapper(Wrapper(Wrapper(42)));
    println!("多重包装值: {}", *wrapped);
    
    // ==================== DerefMut ====================
    println!("\n=== DerefMut ===");
    
    struct MyMutBox<T>(T);
    
    impl<T> MyMutBox<T> {
        fn new(x: T) -> MyMutBox<T> {
            MyMutBox(x)
        }
    }
    
    impl<T> Deref for MyMutBox<T> {
        type Target = T;
        
        fn deref(&self) -> &T {
            &self.0
        }
    }
    
    impl<T> DerefMut for MyMutBox<T> {
        fn deref_mut(&mut self) -> &mut T {
            &mut self.0
        }
    }
    
    let mut x = MyMutBox::new(5);
    *x += 10;
    println!("可变解引用: {}", x);
    
    // ==================== 字符串与 Deref ====================
    println!("\n=== 字符串与 Deref ===");
    
    // String 实现了 Deref<Target = str>
    let s = String::from("Hello, World!");
    let r: &str = &s;  // 自动解引用
    println!("String -> &str: {}", r);
    
    // Vec 实现了 Deref<Target = [T]>
    let v = vec![1, 2, 3, 4, 5];
    let slice: &[i32] = &v;  // 自动解引用
    println!("Vec -> &[i32]: {:?}", slice);
    
    // ==================== 智能指针与 Deref ====================
    println!("\n=== 智能指针与 Deref ===");
    
    // Box<T> 实现了 Deref<Target = T>
    let boxed = Box::new(42);
    let reference: &i32 = &boxed;  // 自动解引用
    println!("Box -> &i32: {}", reference);
    
    // Rc<T> 实现了 Deref<Target = T>
    let rc = Rc::new(String::from("Hello"));
    let r: &str = &rc;  // 自动解引用
    println!("Rc -> &str: {}", r);
    
    // ==================== 自定义智能指针 ====================
    println!("\n=== 自定义智能指针 ===");
    
    struct UniquePointer<T> {
        value: T,
    }
    
    impl<T> UniquePointer<T> {
        fn new(value: T) -> Self {
            UniquePointer { value }
        }
    }
    
    impl<T> Deref for UniquePointer<T> {
        type Target = T;
        
        fn deref(&self) -> &T {
            &self.value
        }
    }
    
    impl<T> DerefMut for UniquePointer<T> {
        fn deref_mut(&mut self) -> &mut T {
            &mut self.value
        }
    }
    
    let mut ptr = UniquePointer::new(42);
    println!("值: {}", *ptr);
    *ptr += 8;
    println!("修改后: {}", *ptr);
    
    // ==================== Deref 与方法调用 ====================
    println!("\n=== Deref 与方法调用 ===");
    
    struct SmartString {
        data: String,
    }
    
    impl SmartString {
        fn new(s: &str) -> Self {
            SmartString {
                data: String::from(s),
            }
        }
    }
    
    impl Deref for SmartString {
        type Target = str;
        
        fn deref(&self) -> &str {
            &self.data
        }
    }
    
    let s = SmartString::new("Hello, World!");
    
    // 可以直接调用 str 的方法
    println!("长度: {}", s.len());
    println!("包含 'World': {}", s.contains("World"));
    println!("大写: {}", s.to_uppercase());
    
    // ==================== Deref 与函数参数 ====================
    println!("\n=== Deref 与函数参数 ===");
    
    fn print_string(s: &str) {
        println!("字符串: {}", s);
    }
    
    let boxed = Box::new(String::from("Hello"));
    print_string(&boxed);  // 自动解引用
    
    let rc = Rc::new(String::from("World"));
    print_string(&rc);  // 自动解引用
    
    // ==================== Deref 强制转换规则 ====================
    println!("\n=== Deref 强制转换规则 ===");
    
    println!("规则:");
    println!("1. 当 T: Deref<Target=U> 时，&T 可以转换为 &U");
    println!("2. 当 T: DerefMut<Target=U> 时，&mut T 可以转换为 &mut U");
    println!("3. 当 T: Deref<Target=U> 时，&mut T 可以转换为 &U");
    
    // ==================== 实际应用 ====================
    println!("\n=== 实际应用 ===");
    
    struct Config {
        data: String,
    }
    
    impl Config {
        fn new(data: &str) -> Self {
            Config {
                data: String::from(data),
            }
        }
    }
    
    impl Deref for Config {
        type Target = str;
        
        fn deref(&self) -> &str {
            &self.data
        }
    }
    
    fn parse_config(config: &str) -> Vec<(&str, &str)> {
        config
            .lines()
            .filter_map(|line| line.split_once('='))
            .collect()
    }
    
    let config = Config::new("name=Alice\nage=30\ncity=Beijing");
    let pairs = parse_config(&config);
    
    println!("配置项:");
    for (key, value) in pairs {
        println!("  {} = {}", key, value);
    }
    
    println!("\nDeref 强制转换演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_deref_coercion.rs -o 01_deref_coercion.exe
//   01_deref_coercion.exe
//
// Linux/macOS:
//   rustc 01_deref_coercion.rs -o 01_deref_coercion
//   ./01_deref_coercion
// ============================================
