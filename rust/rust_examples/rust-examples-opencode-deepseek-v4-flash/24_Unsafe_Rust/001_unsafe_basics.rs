// ============================================================
// Rust 知识点：Unsafe Rust —— 五种超能力
// unsafe 不会关闭借用检查器，只是允许以下五种操作
// 编译：rustc 001_unsafe_basics.rs && .\001_unsafe_basics.exe
// ============================================================

fn main() {
    // ========== 1. 解引用裸指针 ==========
    // 裸指针 *const T 和 *mut T
    // 不受借用规则约束

    let mut num = 42;

    // 创建裸指针（可以在 safe 代码中创建）
    let r1 = &num as *const i32; // 不可变裸指针
    let r2 = &mut num as *mut i32; // 可变裸指针

    // 解引用裸指针必须在 unsafe 块中
    unsafe {
        println!("r1 指向: {}", *r1);
        println!("r2 指向: {}", *r2);

        *r2 = 100;
        println!("修改后: {}", *r1);
    }

    // ========== 2. 调用 unsafe 函数/方法 ----
    unsafe fn dangerous() {
        println!("这是 unsafe 函数");
    }

    unsafe {
        dangerous();
    }

    // ========== 3. 访问/修改可变静态变量 ==========
    static mut COUNTER: u32 = 0;

    unsafe {
        let ptr = std::ptr::addr_of_mut!(COUNTER);
        *ptr += 1;
        println!("COUNTER: {}", *ptr);
    }

    // ========== 4. 实现 unsafe trait ==========
    unsafe trait UnsafeTrait {
        fn unsafe_method(&self);
    }

    struct MyType;

    unsafe impl UnsafeTrait for MyType {
        fn unsafe_method(&self) {
            println!("实现了 unsafe trait");
        }
    }

    let my_type = MyType;
    my_type.unsafe_method();

    // ========== 5. 访问 union 的字段 ==========
    union MyUnion {
        i: i32,
        f: f32,
    }

    let u = MyUnion { i: 42 };
    unsafe {
        // union 的字段访问是不安全的
        println!("union 的整数: {}", u.i);
    }

    // ========== unsafe 的合理使用 ==========
    // 1. FFI 调用外部 C 函数
    // 2. 与硬件直接交互
    // 3. 实现底层抽象（如 Vec, HashMap）
    // 4. 性能关键代码

    println!("\nunsafe 的5种能力：");
    println!("1. 解引用裸指针");
    println!("2. 调用 unsafe 函数");
    println!("3. 访问可变静态变量");
    println!("4. 实现 unsafe trait");
    println!("5. 访问 union 字段");
    println!("\n安全抽象原则：unsafe 代码应该封装在 safe 接口中");
}
