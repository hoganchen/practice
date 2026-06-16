// ============================================================
// Rust 知识点：闭包捕获模式 —— FnOnce / FnMut / Fn
// 编译：rustc 002_closure_capture_modes.rs && .\002_closure_capture_modes.exe
// ============================================================

fn main() {
    // ---- FnOnce：获取所有权 ----
    // 闭包通过值捕获变量（获取所有权）
    let s = String::from("hello");
    let consume = || {
        println!("消费: {}", s);
        drop(s); // 获取所有权
    };
    consume();
    // consume(); // 不能调用两次！s 已被 drop

    // ---- FnMut：可变借用 ----
    let mut count = 0;
    let mut increment = || {
        count += 1; // 可变借用 count
        println!("count = {}", count);
    };

    increment(); // count = 1
    increment(); // count = 2
    // println!("{}", count); // 编译错误！被闭包可变借用中

    drop(increment); // 释放闭包的可变借用
    println!("count = {}", count); // 现在可以了

    // ---- Fn：不可变借用 ----
    let data = vec![1, 2, 3];
    let print_data = || {
        println!("data = {:?}", data); // 不可变借用
    };

    print_data();
    print_data(); // 可以多次调用
    println!("data 仍可用: {:?}", data); // 没问题

    // ---- move 关键字 ----
    // 强制闭包获取变量的所有权（即使只是不可变借用）
    let name = String::from("Alice");
    let move_closure = move || {
        // 即使只是 println!，也用 move 获取了所有权
        println!("name = {}", name);
    };
    // println!("{}", name); // 编译错误！所有权已转移到闭包
    move_closure();
    // move_closure(); // 但这里可以多次调用（因为是 Fn，不是 FnOnce）

    // ---- 闭包与函数指针 ----
    fn add_one_fn(x: i32) -> i32 {
        x + 1
    }
    let add_one_closure = |x: i32| x + 1;

    // 函数指针和闭包都可以作为函数指针参数
    fn call_with_one<F>(f: F) -> i32
    where
        F: Fn(i32) -> i32,
    {
        f(1)
    }

    println!("函数: {}", call_with_one(add_one_fn));
    println!("闭包: {}", call_with_one(add_one_closure));

    // 不捕获环境的闭包可以转为函数指针
    let c = |x| x * 2;
    let fp: fn(i32) -> i32 = c;
    println!("函数指针: {}", fp(5));
}
