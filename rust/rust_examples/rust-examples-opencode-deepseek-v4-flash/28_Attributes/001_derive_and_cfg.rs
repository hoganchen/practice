// ============================================================
// Rust 知识点：派生属性（#[derive]）和条件编译（#[cfg]）
// 编译：rustc 001_derive_and_cfg.rs && .\001_derive_and_cfg.exe
// ============================================================

// ========== #[derive] 派生属性 ==========
// 自动实现常见 trait

#[derive(Debug, Clone, PartialEq, Eq, Hash, Default)]
struct Person {
    name: String,
    age: u8,
    active: bool,
}

// ========== #[cfg] 条件编译 ==========
// 根据条件决定是否编译某段代码

// 仅当目标系统是 Windows 时编译
#[cfg(target_os = "windows")]
fn platform_specific() {
    println!("Windows 特定代码");
}

// 仅当目标系统不是 Windows 时编译
#[cfg(not(target_os = "windows"))]
fn platform_specific() {
    println!("非 Windows 特定代码");
}

// ---- cfg! 宏（运行时检查） ----
fn check_platform() {
    if cfg!(target_os = "windows") {
        println!("运行时检测：当前是 Windows");
    } else if cfg!(target_os = "linux") {
        println!("运行时检测：当前是 Linux");
    } else {
        println!("运行时检测：其他系统");
    }

    if cfg!(debug_assertions) {
        println!("Debug 模式（运行时检测）");
    } else {
        println!("Release 模式（运行时检测）");
    }
}

// ---- #[cfg(feature = "...")] ----
// 需要 Cargo.toml 中定义 features
// [features]
// my_feature = []
// #[cfg(feature = "my_feature")]
// fn with_feature() {}

// ---- 其他常用属性 ----
#[allow(dead_code)]          // 允许未使用的代码
fn unused_function() {
    println!("这个函数不会被警告");
}

#[deprecated(since = "1.0.0", note = "请使用 new_function 替代")]
fn old_function() {
    println!("旧函数");
}

#[must_use]                  // 返回值必须被使用
fn must_use_result() -> i32 {
    42
}

// ---- #[repr] 控制内存布局 ----
#[repr(C)]                   // C 语言 ABI 兼容的内存布局
struct CCompatible {
    x: i32,
    y: i32,
}

#[repr(align(16))]           // 16 字节对齐
struct Aligned {
    data: [u8; 8],
}

fn main() {
    // 派生属性
    let p1 = Person {
        name: "Alice".to_string(),
        age: 30,
        active: true,
    };
    let p2 = p1.clone();
    println!("{:?}", p1);
    println!("p1 == p2: {}", p1 == p2);

    let p3: Person = Person::default();
    println!("默认: {:?}", p3);

    // 条件编译
    platform_specific();
    check_platform();

    // deprecated 警告
    // old_function(); // 调用会有弃用警告

    // must_use
    // must_use_result(); // 警告：未使用返回值

    // repr
    println!("\n内存布局:");
    println!("CCompatible 大小: {} 字节", std::mem::size_of::<CCompatible>());
    println!("Aligned 大小: {} 字节", std::mem::size_of::<Aligned>());

    // ---- inline 属性 ----
    #[inline(always)]
    fn small_function() -> i32 {
        42
    }
    println!("inline function: {}", small_function());
}
