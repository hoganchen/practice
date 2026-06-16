// ============================================================
// Rust 知识点：FFI —— 调用 C 库和导出 Rust 函数给 C
// 编译：rustc 001_extern_c_ffi.rs && .\001_extern_c_ffi.exe
// 注意：某些示例需要链接 C 库
// ============================================================

use std::ffi::{CStr, CString};
use std::os::raw::c_char;

// ========== 调用 C 标准库 ==========

// 声明外部 C 函数
extern "C" {
    // 字符串长度
    fn strlen(s: *const c_char) -> usize;

    // 比较字符串
    fn strcmp(s1: *const c_char, s2: *const c_char) -> i32;

    // 内存复制
    fn memcpy(dest: *mut u8, src: *const u8, n: usize) -> *mut u8;

    // 获取环境变量
    fn getenv(name: *const c_char) -> *mut c_char;

    // 退出进程
    fn exit(status: i32) -> !;
}

// ========== 安全的封装 ==========
fn safe_strlen(s: &str) -> usize {
    let c_str = CString::new(s).expect("CString 包含空字节");
    unsafe { strlen(c_str.as_ptr()) }
}

fn safe_getenv(name: &str) -> Option<String> {
    let c_name = CString::new(name).ok()?;
    unsafe {
        let ptr = getenv(c_name.as_ptr());
        if ptr.is_null() {
            None
        } else {
            Some(CStr::from_ptr(ptr).to_string_lossy().into_owned())
        }
    }
}

// ========== 导出 Rust 函数给 C ==========
#[no_mangle] // 防止名称修饰
pub extern "C" fn rust_add(a: i32, b: i32) -> i32 {
    a + b
}

#[no_mangle]
pub extern "C" fn rust_greet(name: *const c_char) -> *mut c_char {
    let name_str = unsafe { CStr::from_ptr(name) }
        .to_str()
        .unwrap_or("unknown");

    let greeting = format!("Hello, {}!", name_str);
    CString::new(greeting).unwrap().into_raw() // 返回 C 字符串
}

// 释放由 Rust 分配的 C 字符串
#[no_mangle]
pub extern "C" fn rust_free_string(s: *mut c_char) {
    if !s.is_null() {
        unsafe {
            let _ = CString::from_raw(s);
        }
    }
}

// ========== 使用 repr(C) 确保布局兼容 ==========
#[repr(C)]
#[derive(Debug)]
struct Point {
    x: f64,
    y: f64,
}

#[no_mangle]
pub extern "C" fn create_point(x: f64, y: f64) -> Point {
    Point { x, y }
}

fn main() {
    // ---- 调用 C 的 strlen ----
    let s = "Hello, FFI!";
    let len = safe_strlen(s);
    println!("safe_strlen('{}') = {}", s, len);

    // ---- 获取环境变量 ----
    match safe_getenv("PATH") {
        Some(val) => println!("PATH = {}", val),
        None => println!("PATH 未设置"),
    }

    // ---- CString 和 CStr 的使用 ----
    let c_string = CString::new("C String").unwrap();
    let c_str: &CStr = &c_string;
    let rust_str: &str = c_str.to_str().unwrap();
    println!("CStr 转 &str: {}", rust_str);

    // ---- repr(C) 结构体 ----
    let point = create_point(3.0, 4.0);
    println!("repr(C) Point: {:?}", point);

    // ---- FFI 安全指导 ----
    println!("\nFFI 安全注意事项：");
    println!("1. 使用 repr(C) 确保布局兼容");
    println!("2. 使用 #[no_mangle] 防止名称修饰");
    println!("3. 使用 CString/CStr 处理字符串");
    println!("4. 正确处理所有权和内存释放");
    println!("5. unsafely 封装在 safe 接口中");
}
