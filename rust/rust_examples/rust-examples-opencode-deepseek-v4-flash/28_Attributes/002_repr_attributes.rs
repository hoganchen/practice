// ============================================================
// Rust 知识点：#[repr] 属性 —— 内存布局控制
// 编译：rustc 002_repr_attributes.rs && .\002_repr_attributes.exe
// ============================================================

use std::mem;

// ========== repr(C): C 语言 ABI 兼容布局 ==========
#[repr(C)]
struct PointC {
    x: f64,
    y: f64,
    z: f64,
}

// ========== repr(transparent): 透明包装 ==========
// 只包裹一个字段，内存布局与内部字段完全相同
// 常用于 newtype 模式，确保 FFI 安全
#[repr(transparent)]
struct Wrapper(i32);

#[repr(transparent)]
struct Age {
    inner: u8,
}

// ========== repr(Rust): 默认布局（可优化重排） ==========
#[repr(Rust)]
struct Unoptimized {
    b: bool,       // 1 字节
    i: i64,        // 8 字节
    c: bool,       // 1 字节
}

#[repr(C)]
struct Optimized {
    b: bool,       // 1 字节
    c: bool,       // 1 字节
    i: i64,        // 8 字节
}

// ========== repr(u8/u16/u32/u64): 枚举判别式大小 ==========
// 控制枚举在内存中的标签大小
#[repr(u8)]
enum SmallEnum {
    A = 1,
    B = 2,
    C = 3,
}

#[repr(u32)]
enum BigEnum {
    X = 0xFFFF_FFFF,
    Y = 0xEEEE_EEEE,
}

// ========== repr(align(N)): 对齐控制 ==========
#[repr(align(64))]  // 64 字节对齐（针对缓存行优化）
struct CacheAligned {
    data: [u8; 8],
}

// ========== repr(packed): 紧凑布局（无填充） ==========
#[repr(packed)]
struct Packed {
    b: bool,    // 1
    i: i64,     // 8（紧接着 b，无填充）
    c: bool,    // 1
}

fn main() {
    // ---- 默认布局 vs C 布局 ----
    println!("=== repr(Rust) vs repr(C) ===");
    println!("Unoptimized (Rust) 大小: {} 字节", mem::size_of::<Unoptimized>());
    println!("Optimized (C) 大小: {} 字节", mem::size_of::<Optimized>());
    println!("PointC 大小: {} 字节", mem::size_of::<PointC>());

    // ---- repr(transparent) ----
    println!("\n=== repr(transparent) ===");
    println!("i32 大小: {}", mem::size_of::<i32>());
    println!("Wrapper 大小: {}", mem::size_of::<Wrapper>()); // 相同
    println!("Age 大小: {}", mem::size_of::<Age>()); // 1 字节
    println!("u8 大小: {}", mem::size_of::<u8>()); // 1 字节

    // ---- repr(u8) / repr(u32) ----
    println!("\n=== repr(u8/u32) enum ===");
    println!("SmallEnum 大小: {}", mem::size_of::<SmallEnum>());
    println!("BigEnum 大小: {}", mem::size_of::<BigEnum>());
    println!("A = {}", SmallEnum::A as u8);
    println!("X = {}", BigEnum::X as u32);

    // ---- repr(align(64)) ----
    println!("\n=== repr(align(64)) ===");
    println!("CacheAligned 大小: {}", mem::size_of::<CacheAligned>());
    println!("CacheAligned 对齐: {}", mem::align_of::<CacheAligned>());

    // ---- repr(packed) ----
    println!("\n=== repr(packed) ===");
    println!("Packed 大小: {} 字节", mem::size_of::<Packed>());
    println!("如果无 packed 应为: {}", mem::size_of::<[u8; 10]>() + 7/*padding*/);

    // ---- repr 组合 ----
    #[repr(C, packed)]
    struct PackedC {
        a: u8,
        b: u32,
        c: u8,
    }
    println!("repr(C, packed) 大小: {}", mem::size_of::<PackedC>());

    // ---- repr(align) 与缓存行优化 ----
    #[repr(align(128))]
    struct OverAligned {
        data: [u8; 16],
    }
    println!("\nOverAligned 大小: {}", mem::size_of::<OverAligned>());
    println!("OverAligned 对齐: {}", mem::align_of::<OverAligned>());
}
