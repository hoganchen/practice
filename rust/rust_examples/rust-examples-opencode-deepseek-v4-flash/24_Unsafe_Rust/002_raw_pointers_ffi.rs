// ============================================================
// Rust 知识点：裸指针与 FFI（外部函数接口）
// 编译：rustc 002_raw_pointers_ffi.rs && .\002_raw_pointers_ffi.exe
// ============================================================

// ---- FFI：调用 C 标准库函数 ----
// extern 块声明外部函数
extern "C" {
    // C 的 strlen 函数
    fn strlen(s: *const u8) -> usize;

    // C 的 abs 函数
    fn abs(x: i32) -> i32;

    // C 的 puts 函数（向 stdout 输出字符串）
    fn puts(s: *const u8) -> i32;
}

// ---- 使用 #[no_mangle] 导出 Rust 函数给 C ----
#[no_mangle]
pub extern "C" fn rust_add(a: i32, b: i32) -> i32 {
    a + b
}

// ---- 封装 unsafe 的 safe 抽象 ----
fn safe_strlen(s: &str) -> usize {
    unsafe { strlen(s.as_ptr()) }
}

// ---- 裸指针的高级用法 ----
fn raw_pointer_arithmetic() {
    let arr = [10, 20, 30, 40, 50];
    let ptr = arr.as_ptr(); // *const i32

    unsafe {
        for i in 0..arr.len() {
            // 指针算术：偏移 i 个元素
            let val = *ptr.add(i);
            println!("arr[{}] = {}", i, val);
        }
    }
}

// ---- 创建安全的 Vec 封装（演示裸指针） ----
struct SimpleVec {
    ptr: *mut i32,
    len: usize,
    capacity: usize,
}

impl SimpleVec {
    fn new() -> Self {
        SimpleVec {
            ptr: std::ptr::null_mut(),
            len: 0,
            capacity: 0,
        }
    }

    fn push(&mut self, val: i32) {
        if self.len == self.capacity {
            // 简化处理，实际应该重新分配
            panic!("需要重新分配");
        }
        unsafe {
            *self.ptr.add(self.len) = val;
        }
        self.len += 1;
    }
}

fn main() {
    // ---- 调用 C 函数 ----
    unsafe {
        let s = "Hello, FFI!\0"; // C 字符串需要以 \0 结尾
        println!("C strlen: {}", strlen(s.as_ptr()));
        println!("C abs(-42): {}", abs(-42));
    }

    // ---- 安全的封装 ----
    let s = "Rust 安全封装";
    println!("safe_strlen: {}", safe_strlen(s));

    // ---- 裸指针运算 ----
    raw_pointer_arithmetic();

    // ---- 悬垂指针演示（取消注释会 UB） ----
    // let reference_to_nothing: *const i32;
    // {
    //     let val = 42;
    //     reference_to_nothing = &val as *const i32;
    // }
    // unsafe {
    //     println!("悬垂指针: {}", *reference_to_nothing); // 未定义行为！
    // }

    // ---- 创建空指针 ----
    let null_ptr: *const i32 = std::ptr::null();
    let null_mut_ptr: *mut i32 = std::ptr::null_mut();

    unsafe {
        if null_ptr.is_null() {
            println!("空指针检测");
        }
        // println!("{}", *null_ptr); // UB！解引用空指针
    }

    println!("\n注意：裸指针可能导致未定义行为，谨慎使用");
}
