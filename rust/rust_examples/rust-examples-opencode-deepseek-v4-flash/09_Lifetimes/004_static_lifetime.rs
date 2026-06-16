// ============================================================
// Rust 知识点：'static 生命周期 —— 程序整个运行期
// 编译：rustc 004_static_lifetime.rs && .\004_static_lifetime.exe
// ============================================================

// 'static 引用存活于程序整个运行期间
// 常见于：字符串字面量、全局常量、Box::leak 等

fn main() {
    // ---- 字符串字面量是 'static ----
    let s: &'static str = "Hello Rust!";
    // 字符串字面量直接编译到二进制文件中，生命周期为 'static
    println!("'static 字符串: {}", s);

    // ---- 泛型约束中使用 'static ----
    fn print_static<T: 'static>(val: &T) {
        // T 不包含任何非 'static 引用
        println!("{:?}", val);
    }

    print_static(&42);
    print_static(&"hello");

    // ---- 'static 约束在 trait bound 中 ----
    fn requires_static<T: 'static>(t: T) {
        // T 要么是拥有所有权的类型，要么包含 'static 引用
        let _owned = t;
    }

    // 拥有所有权的类型满足 'static
    requires_static(String::from("hello"));
    requires_static(42);

    // ---- 将堆数据转为 'static（Box::leak） ----
    let boxed = Box::new(String::from("leaked string"));
    let leaked: &'static str = Box::leak(boxed); // 故意泄露内存，获得 'static 引用
    println!("leaked: {}", leaked);
    // 注意：Box::leak 导致内存永远不会被释放

    // ---- 'static 并不意味着永远存活 ----
    // 'static 作为 trait bound 时，意味着"不包含任何非 static 引用"
    // 也就是说，拥有所有权的类型（Owned types）满足 'static

    // 以下函数可以接受拥有所有权的类型
    fn accept_static<T: 'static>(val: T) {
        std::mem::drop(val); // 可以 drop
    }

    accept_static(123i32);
    accept_static("hello"); // &'static str

    // ---- 'static 的常见误解 ----
    // 很多人以为 'static 引用永远不能 drop
    // 实际上，'static 引用可以在程序结束前被 drop
    {
        let static_ref: &'static str = "临时使用";
        println!("{}", static_ref);
    } // static_ref 被 drop，但字符串数据本身仍存在于二进制中
}
