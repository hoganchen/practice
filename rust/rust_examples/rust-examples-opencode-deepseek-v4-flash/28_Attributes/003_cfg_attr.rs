// ============================================================
// Rust 知识点：cfg_attr / link_section / no_mangle
// 编译：rustc 003_cfg_attr.rs && .\003_cfg_attr.exe
// ============================================================

// ========== cfg_attr：条件属性 ==========
// 当条件满足时应用某个属性

// 在 Windows 上添加 "windows_only" 别名
#[cfg_attr(target_os = "windows", allow(dead_code))]
fn _windows_function() {
    println!("Windows 特有函数");
}

// 在 debug 模式下增加边界检查
#[cfg_attr(debug_assertions, track_caller)]
fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("除以零（调用位置: {}）", std::panic::Location::caller());
    }
    a / b
}

// ========== no_mangle：禁止名称修饰 ==========
// 用于 FFI 导出，确保 C 链接器能找到符号
#[no_mangle]
pub extern "C" fn rust_add(a: i32, b: i32) -> i32 {
    a + b
}

#[no_mangle]
pub static RUST_VERSION: &str = "1.95";

// ========== link_section：指定链接段 ==========
// 将数据放入特定的 ELF/PE 段
#[used]
#[link_section = ".my_custom_section"]
static CUSTOM_DATA: [u8; 8] = [0xDE, 0xAD, 0xBE, 0xEF, 0x01, 0x02, 0x03, 0x04];

// 中断处理函数（嵌入式开发常见）
// #[link_section = ".isr_vectors"]
// static ISR_VECTOR: unsafe extern "C" fn() = handler;

// ========== used：防止编译器移除 ==========
#[used]
static KEEP_ME: i32 = 42;

// ========== allow / deny / warn / forbid ==========
#[allow(unused_variables)]
fn unused_params(x: i32) {
    // x 被"允许"不使用
    println!("参数未使用但不会警告");
}

#[deny(unused_results)]  // 必须使用结果
fn must_use_result() -> i32 {
    42
}

// ========== track_caller：记录调用位置 ==========
fn panic_with_location() {
    panic!("错误发生在: {}", std::panic::Location::caller());
}

fn main() {
    // ---- cfg_attr 测试 ----
    println!("divide(10, 2) = {}", divide(10, 2));
    // println!("{}", divide(10, 0)); // 取消注释会 panic 并显示位置

    // ---- no_mangle 测试 ----
    println!("no_mangle rust_add: {}", rust_add(10, 20));
    println!("no_mangle RUST_VERSION: {}", RUST_VERSION);

    // ---- track_caller ----
    // println!("尝试: {}", divide(10, 0));

    // ---- cfg! 运行时检测 ----
    if cfg!(feature = "my_feature") {
        println!("my_feature 已启用");
    }

    if cfg!(target_endian = "little") {
        println!("小端序系统");
    }

    // ---- 编译时与运行时 ----
    println!("\n当前编译配置:");
    println!("target_os: {}", if cfg!(target_os = "windows") { "windows" } else { "other" });
    println!("debug_assertions: {}", cfg!(debug_assertions));
    println!("target_pointer_width: {}", cfg!(target_pointer_width));

    // ---- doc(cfg)：文档中显示配置条件 ----
    // 只能用在 Cargo 项目的公开 API 上
    // #[doc(cfg(feature = "serde"))]
    // pub fn with_serde() {}
}
