// ============================================================
// Rust 知识点：类型推断与类型别名
// 编译：rustc 006_type_inference_alias.rs && .\006_type_inference_alias.exe
// ============================================================

// ---- 类型别名 ----
// 使用 `type` 关键字为现有类型创建别名（类似 C 的 typedef）
type NanoSecond = u64;   // 纳秒
type Inch = u64;         // 英寸
type Age = u32;          // 年龄

// 别名只是别名，不是新类型，不会增加类型安全
// 但可以提高代码的可读性和可维护性

fn main() {
    // ---- 类型推断 ----
    // Rust 编译器可以通过上下文推断变量类型
    let x = 42;               // 推断为 i32（默认整数类型）
    let y = 3.14;             // 推断为 f64（默认浮点类型）
    let z = "hello";          // 推断为 &str

    // 通过使用方式推断
    let vec = vec![1, 2, 3];  // 推断为 Vec<i32>
    let len = vec.len();      // 推断为 usize

    // 通过方法调用推断
    let parsed: u64 = "42".parse().unwrap(); // parse 需类型推断

    println!("x = {x}, y = {y}, z = {z}");
    println!("parsed = {parsed}");

    // ---- 使用类型别名 ----
    let nanoseconds: NanoSecond = 1_000_000_000;
    let inches: Inch = 12;
    let my_age: Age = 30;

    // 别名类型与其基础类型可以混用
    let sum: u64 = nanoseconds + inches; // NanoSecond 和 Inch 都是 u64
    println!("纳秒: {nanoseconds}, 英寸: {inches}, 年龄: {my_age}");
    println!("别名类型相加: {sum}");

    // ---- 类型标注场景 ----
    // 1. 类型转换时
    let guess = "42".parse::<i32>(); // 使用 turbofish 语法标注

    // 2. 返回值类型（函数签名）
    // 3. 结构体字段
    // 4. 泛型约束

    match guess {
        Ok(n) => println!("解析成功: {n}"),
        Err(e) => println!("解析失败: {e}"),
    }
}
