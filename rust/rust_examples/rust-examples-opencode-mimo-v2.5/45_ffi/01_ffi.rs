// ============================================
// 知识点：FFI (Foreign Function Interface)
// 难度：高级
// ============================================

// FFI 允许 Rust 与其他语言（如 C）交互
// 使用 extern 块声明外部函数

use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int};

fn main() {
    // ==================== 基础 FFI ====================
    println!("=== 基础 FFI ===");
    
    // 声明 C 标准库函数
    extern "C" {
        fn abs(input: c_int) -> c_int;
        fn sqrt(input: f64) -> f64;
    }
    
    unsafe {
        println!("abs(-5) = {}", abs(-5));
        println!("sqrt(25.0) = {}", sqrt(25.0));
    }
    
    // ==================== 字符串转换 ====================
    println!("\n=== 字符串转换 ===");
    
    // Rust 字符串 -> C 字符串
    let rust_string = String::from("Hello, C!");
    let c_string = CString::new(rust_string).unwrap();
    
    println!("C 字符串: {:?}", c_string);
    println!("C 字符串指针: {:?}", c_string.as_ptr());
    
    // C 字符串 -> Rust 字符串
    let c_string = CString::new("Hello, Rust!").unwrap();
    let rust_string = c_string.to_str().unwrap();
    
    println!("Rust 字符串: {}", rust_string);
    
    // ==================== 调用 C 函数 ====================
    println!("\n=== 调用 C 函数 ===");
    
    extern "C" {
        fn strlen(s: *const c_char) -> usize;
    }
    
    let c_string = CString::new("Hello, World!").unwrap();
    
    unsafe {
        let len = strlen(c_string.as_ptr());
        println!("字符串长度: {}", len);
    }
    
    // ==================== 导出 Rust 函数 ====================
    println!("\n=== 导出 Rust 函数 ===");
    
    // 这个函数可以被 C 代码调用
    #[no_mangle]
    pub extern "C" fn rust_add(a: c_int, b: c_int) -> c_int {
        a + b
    }
    
    println!("Rust 函数: rust_add(3, 4) = {}", rust_add(3, 4));
    
    // ==================== 结构体交互 ====================
    println!("\n=== 结构体交互 ===");
    
    #[repr(C)]
    struct Point {
        x: f64,
        y: f64,
    }
    
    impl Point {
        fn new(x: f64, y: f64) -> Self {
            Point { x, y }
        }
        
        fn distance_from_origin(&self) -> f64 {
            (self.x.powi(2) + self.y.powi(2)).sqrt()
        }
    }
    
    // 导出给 C 使用的函数
    #[no_mangle]
    pub extern "C" fn create_point(x: f64, y: f64) -> Box<Point> {
        Box::new(Point::new(x, y))
    }
    
    #[no_mangle]
    pub extern "C" fn destroy_point(point: Box<Point>) {
        drop(point);
    }
    
    let point = create_point(3.0, 4.0);
    println!("点距离原点: {}", point.distance_from_origin());
    
    // ==================== 回调函数 ====================
    println!("\n=== 回调函数 ===");
    
    type Callback = extern "C" fn(c_int) -> c_int;
    
    extern "C" {
        fn call_with_callback(value: c_int, callback: Callback) -> c_int;
    }
    
    extern "C" fn double_value(x: c_int) -> c_int {
        x * 2
    }
    
    // 在实际应用中会调用外部函数
    // unsafe { call_with_callback(5, double_value); }
    
    println!("回调函数: double_value(5) = {}", double_value(5));
    
    // ==================== 错误处理 ====================
    println!("\n=== 错误处理 ===");
    
    // C 风格的错误处理
    extern "C" {
        fn divide(a: f64, b: f64, result: *mut f64) -> c_int;
    }
    
    // 模拟实现
    fn safe_divide(a: f64, b: f64) -> Result<f64, String> {
        if b == 0.0 {
            Err(String::from("除数不能为零"))
        } else {
            Ok(a / b)
        }
    }
    
    match safe_divide(10.0, 3.0) {
        Ok(result) => println!("10 / 3 = {:.2}", result),
        Err(e) => println!("错误: {}", e),
    }
    
    match safe_divide(10.0, 0.0) {
        Ok(result) => println!("10 / 0 = {:.2}", result),
        Err(e) => println!("错误: {}", e),
    }
    
    // ==================== 内存管理 ====================
    println!("\n=== 内存管理 ===");
    
    // 分配和释放内存
    unsafe {
        // 分配内存
        let layout = std::alloc::Layout::new::<[i32; 10]>();
        let ptr = std::alloc::alloc(layout) as *mut i32;
        
        if ptr.is_null() {
            println!("内存分配失败");
        } else {
            // 使用内存
            for i in 0..10 {
                *ptr.add(i) = i as i32;
            }
            
            // 读取内存
            for i in 0..10 {
                print!("{} ", *ptr.add(i));
            }
            println!();
            
            // 释放内存
            std::alloc::dealloc(ptr as *mut u8, layout);
        }
    }
    
    // ==================== 安全封装 ====================
    println!("\n=== 安全封装 ===");
    
    struct SafeBuffer {
        ptr: *mut u8,
        size: usize,
    }
    
    impl SafeBuffer {
        fn new(size: usize) -> Option<Self> {
            unsafe {
                let layout = std::alloc::Layout::array::<u8>(size).ok()?;
                let ptr = std::alloc::alloc(layout);
                
                if ptr.is_null() {
                    None
                } else {
                    Some(SafeBuffer { ptr, size })
                }
            }
        }
        
        fn as_slice(&self) -> &[u8] {
            unsafe { std::slice::from_raw_parts(self.ptr, self.size) }
        }
    }
    
    impl Drop for SafeBuffer {
        fn drop(&mut self) {
            unsafe {
                let layout = std::alloc::Layout::array::<u8>(self.size).unwrap();
                std::alloc::dealloc(self.ptr, layout);
            }
        }
    }
    
    if let Some(buffer) = SafeBuffer::new(1024) {
        println!("缓冲区大小: {}", buffer.size);
    }
    
    // ==================== 实际应用 ====================
    println!("\n=== 实际应用 ===");
    
    // 日期时间（模拟 C 库）
    extern "C" {
        fn time(ptr: *mut i64) -> i64;
    }
    
    // 获取当前时间戳
    unsafe {
        let timestamp = time(std::ptr::null_mut());
        println!("时间戳: {}", timestamp);
    }
    
    // 数学函数
    extern "C" {
        fn pow(base: f64, exp: f64) -> f64;
        fn ceil(x: f64) -> f64;
        fn floor(x: f64) -> f64;
    }
    
    unsafe {
        println!("2^10 = {}", pow(2.0, 10.0));
        println!("ceil(3.7) = {}", ceil(3.7));
        println!("floor(3.7) = {}", floor(3.7));
    }
    
    println!("\nFFI (Foreign Function Interface) 演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_ffi.rs -o 01_ffi.exe
//   01_ffi.exe
//
// Linux/macOS:
//   rustc 01_ffi.rs -o 01_ffi
//   ./01_ffi
//
// 注意：某些 C 函数可能在 Windows 上不可用
// ============================================
