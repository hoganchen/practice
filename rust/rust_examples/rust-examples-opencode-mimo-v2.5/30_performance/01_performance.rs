// ============================================
// 知识点：性能优化
// 难度：高级
// ============================================

// Rust 提供了多种性能优化技术
// 包括零成本抽象、内存优化、并发等

use std::collections::HashMap;
use std::time::{Duration, Instant};

fn main() {
    println!("=== Rust 性能优化 ===");
    
    // ==================== 零成本抽象 ====================
    println!("\n=== 零成本抽象 ===");
    
    // 迭代器是零成本抽象
    let numbers: Vec<i32> = (1..=1000000).collect();
    
    let start = Instant::now();
    let sum: i32 = numbers.iter().sum();
    let duration = start.elapsed();
    println!("迭代器求和: {} (耗时: {:?})", sum, duration);
    
    // 手动循环
    let start = Instant::now();
    let mut sum = 0;
    for &num in &numbers {
        sum += num;
    }
    let duration = start.elapsed();
    println!("手动循环: {} (耗时: {:?})", sum, duration);
    
    // ==================== 内存优化 ====================
    println!("\n=== 内存优化 ===");
    
    // 使用 Vec 而不是 LinkedList
    println!("Vec 内存布局: 连续内存，缓存友好");
    println!("LinkedList 内存布局: 不连续，缓存不友好");
    
    // 使用 &[T] 而不是 &Vec<T>
    fn process_slice(data: &[i32]) -> i32 {
        data.iter().sum()
    }
    
    let vec = vec![1, 2, 3, 4, 5];
    let sum = process_slice(&vec);
    println!("切片处理: {}", sum);
    
    // ==================== 字符串优化 ====================
    println!("\n=== 字符串优化 ===");
    
    // 使用 &str 而不是 String
    fn process_str(s: &str) -> String {
        format!("处理: {}", s)
    }
    
    let result = process_str("hello");
    println!("字符串处理: {}", result);
    
    // 预分配字符串容量
    let mut s = String::with_capacity(100);
    for i in 0..10 {
        s.push_str(&format!("item{} ", i));
    }
    println!("预分配字符串: {}", s);
    
    // ==================== HashMap 优化 ====================
    println!("\n=== HashMap 优化 ===");
    
    // 预分配容量
    let mut map = HashMap::with_capacity(1000);
    for i in 0..1000 {
        map.insert(i, i * 2);
    }
    println!("预分配 HashMap: {} 个元素", map.len());
    
    // 使用 entry API
    let mut scores: HashMap<String, i32> = HashMap::new();
    let names = vec!["Alice", "Bob", "Alice", "Charlie", "Bob"];
    
    for name in names {
        *scores.entry(name.to_string()).or_insert(0) += 1;
    }
    println!("分数: {:?}", scores);
    
    // ==================== 迭代器优化 ====================
    println!("\n=== 迭代器优化 ===");
    
    // 使用迭代器链
    let numbers: Vec<i32> = (1..=1000).collect();
    
    let start = Instant::now();
    let result: Vec<i32> = numbers
        .iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * x)
        .collect();
    let duration = start.elapsed();
    println!("迭代器链: {} 个结果 (耗时: {:?})", result.len(), duration);
    
    // 使用 fold 而不是 collect + sum
    let start = Instant::now();
    let sum: i32 = numbers.iter().fold(0, |acc, &x| acc + x);
    let duration = start.elapsed();
    println!("fold 求和: {} (耗时: {:?})", sum, duration);
    
    // ==================== 并发优化 ====================
    println!("\n=== 并发优化 ===");
    
    use std::sync::{Arc, Mutex};
    use std::thread;
    
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    
    let start = Instant::now();
    
    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            for _ in 0..100000 {
                let mut num = counter.lock().unwrap();
                *num += 1;
            }
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    let duration = start.elapsed();
    println!("并发计数: {} (耗时: {:?})", *counter.lock().unwrap(), duration);
    
    // ==================== 内存分配优化 ====================
    println!("\n=== 内存分配优化 ===");
    
    // 使用 Vec::with_capacity
    let start = Instant::now();
    let mut vec = Vec::with_capacity(10000);
    for i in 0..10000 {
        vec.push(i);
    }
    let duration = start.elapsed();
    println!("预分配 Vec: {} (耗时: {:?})", vec.len(), duration);
    
    // 不预分配
    let start = Instant::now();
    let mut vec = Vec::new();
    for i in 0..10000 {
        vec.push(i);
    }
    let duration = start.elapsed();
    println!("动态 Vec: {} (耗时: {:?})", vec.len(), duration);
    
    // ==================== 字符串连接优化 ====================
    println!("\n=== 字符串连接优化 ===");
    
    // 使用 push_str
    let start = Instant::now();
    let mut result = String::new();
    for i in 0..1000 {
        result.push_str(&format!("item{} ", i));
    }
    let duration = start.elapsed();
    println!("push_str: {} 字符 (耗时: {:?})", result.len(), duration);
    
    // 使用 join
    let start = Instant::now();
    let items: Vec<String> = (0..1000).map(|i| format!("item{}", i)).collect();
    let result = items.join(" ");
    let duration = start.elapsed();
    println!("join: {} 字符 (耗时: {:?})", result.len(), duration);
    
    // ==================== 数组切片优化 ====================
    println!("\n=== 数组切片优化 ===");
    
    // 使用切片而不是 Vec
    fn process_large_slice(data: &[i32]) -> i32 {
        data.iter().sum()
    }
    
    let large_array = vec![1; 1000000];
    let start = Instant::now();
    let sum = process_large_slice(&large_array);
    let duration = start.elapsed();
    println!("大切片处理: {} (耗时: {:?})", sum, duration);
    
    // ==================== 枚举优化 ====================
    println!("\n=== 枚举优化 ===");
    
    // 使用较小的枚举类型
    #[repr(u8)]
    enum SmallEnum {
        A,
        B,
        C,
    }
    
    println!("SmallEnum 大小: {} 字节", std::mem::size_of::<SmallEnum>());
    
    // ==================== 结构体优化 ====================
    println!("\n=== 结构体优化 ===");
    
    // 使用 #[repr(C)] 控制内存布局
    #[repr(C)]
    struct OptimizedStruct {
        a: u8,
        b: u8,
        c: u32,
    }
    
    println!("OptimizedStruct 大小: {} 字节", std::mem::size_of::<OptimizedStruct>());
    
    // ==================== 性能分析工具 ====================
    println!("\n=== 性能分析工具 ===");
    
    println!("cargo bench - 基准测试");
    println!("cargo profiling - 性能分析");
    println!("cargo-flamegraph - 火焰图");
    println!("cargo-profiling - 性能分析");
    println!("criterion.rs - 基准测试框架");
    
    // ==================== 编译器优化 ====================
    println!("\n=== 编译器优化 ===");
    
    println!("开发构建: cargo build");
    println!("发布构建: cargo build --release");
    println!("优化级别:");
    println!("  0 - 无优化");
    println!("  1 - 基本优化");
    println!("  2 - 更多优化");
    println!("  3 - 最大优化");
    println!("  s - 优化大小");
    println!("  z - 最小大小");
    
    // ==================== 内存安全与性能 ====================
    println!("\n=== 内存安全与性能 ===");
    
    // Rust 在编译时保证内存安全
    // 无需运行时开销
    
    println!("Rust 内存安全特点:");
    println!("  - 所有权系统");
    println!("  - 借用检查器");
    println!("  - 无数据竞争");
    println!("  - 无空指针解引用");
    println!("  - 无缓冲区溢出");
    
    // ==================== 实际优化示例 ====================
    println!("\n=== 实际优化示例 ===");
    
    // 使用位运算
    fn is_power_of_two(n: u32) -> bool {
        n != 0 && (n & (n - 1)) == 0
    }
    
    println!("2 是 2 的幂: {}", is_power_of_two(2));
    println!("3 是 2 的幂: {}", is_power_of_two(3));
    println!("4 是 2 的幂: {}", is_power_of_two(4));
    
    // 使用预计算
    const TABLE_SIZE: usize = 256;
    static mut TABLE: [u32; TABLE_SIZE] = [0; TABLE_SIZE];
    
    unsafe {
        for i in 0..TABLE_SIZE {
            TABLE[i] = (i as u32) * (i as u32);
        }
    }
    
    unsafe {
        println!("TABLE[10] = {}", TABLE[10]);
    }
    
    println!("\n性能优化演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_performance.rs -o 01_performance.exe
//   01_performance.exe
//
// Linux/macOS:
//   rustc 01_performance.rs -o 01_performance
//   ./01_performance
//
// 性能分析：
//   cargo build --release
//   cargo run --release
//   cargo bench
// ============================================
