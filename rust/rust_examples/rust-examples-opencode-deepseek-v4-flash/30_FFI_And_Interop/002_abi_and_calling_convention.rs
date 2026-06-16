// ============================================================
// Rust 知识点：ABI 和调用约定 —— extern "C" 详解
// 编译：rustc 002_abi_and_calling_convention.rs && .\002_abi_and_calling_convention.exe
// ============================================================

use std::ffi::{CStr, CString};

// ========== Rust 支持的 ABI ==========
// extern "Rust"    — 默认的 Rust ABI（不稳定）
// extern "C"       — C 语言 ABI（最常用）
// extern "stdcall" — Windows API 的 stdcall
// extern "fastcall" — fastcall 约定
// extern "thiscall" — C++ 成员函数
// extern "system"  — Windows 上为 stdcall，其他为 C

#[cfg(target_os = "windows")]
extern "stdcall" {
    // Windows API 函数
    fn GetTickCount() -> u32;
    fn MessageBeep(uType: u32) -> i32;
}

// ========== 可空指针优化（FFI） ==========
// Option<&T> 在 FFI 中表示为可空指针
// None -> NULL, Some(&val) -> 有效指针

extern "C" {
    fn strlen(s: *const std::os::raw::c_char) -> usize;
}

// Rust 侧：使用 Option<&CStr>
fn safe_strlen(s: Option<&CStr>) -> Option<usize> {
    let ptr = match s {
        Some(cstr) => cstr.as_ptr(),
        None => std::ptr::null(),
    };
    if ptr.is_null() {
        return None;
    }
    unsafe { Some(strlen(ptr)) }
}

// ========== 不安全的全局变量 ==========
extern "C" {
    // 链接器提供的符号
    static __ImageBase: std::os::raw::c_void;

    // errno（错误码）
    static errno: i32;
}

// ========== 回调函数 ==========
type Callback = unsafe extern "C" fn(i32) -> i32;

extern "C" fn apply_twice(callback: Callback, val: i32) -> i32 {
    unsafe {
        let first = callback(val);
        callback(first)
    }
}

extern "C" fn double(x: i32) -> i32 {
    x * 2
}

// ========== 可变参数（FFI） ==========
// Rust 不支持直接定义可变参数函数
// 但可以通过 FFI 调用 C 的可变参数函数

extern "C" {
    fn printf(fmt: *const std::os::raw::c_char, ...) -> i32;
}

fn main() {
    // ---- 调用约定 ----
    #[cfg(target_os = "windows")]
    unsafe {
        let ticks = GetTickCount();
        println!("系统运行时间: {} ms", ticks);
    }

    // ---- 可空指针 ----
    let c_str = CString::new("test").unwrap();
    println!("非空指针长度: {:?}", safe_strlen(Some(&c_str)));
    println!("空指针长度: {:?}", safe_strlen(None));

    // ---- 回调函数 ----
    let result = apply_twice(double, 5);
    println!("apply_twice(double, 5) = {}", result); // 5*2*2 = 20

    // ---- 可变参数 ----
    // unsafe {
    //     let fmt = CString::new("Hello %s! Number: %d\n").unwrap();
    //     let name = CString::new("Rust").unwrap();
    //     printf(fmt.as_ptr(), name.as_ptr(), 42);
    // }

    // ---- extern "Rust"（默认） ----
    // 两个函数互相调用
    fn a() {
        println!("a 调用 b");
        b();
    }
    fn b() {
        println!("b 返回");
    }
    a();

    println!("\nABI 类型总结：");
    println!("- extern \"Rust\": 默认，内部使用");
    println!("- extern \"C\": 与 C 交互");
    println!("- extern \"stdcall\": Windows API");
}
