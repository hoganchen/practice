// ============================================================
// Rust 知识点：闭包（Closure）—— 匿名函数
// 闭包可以捕获环境中的变量
// 编译：rustc 001_closure_basics.rs && .\001_closure_basics.exe
// ============================================================

fn main() {
    // ---- 定义闭包 ----
    // 语法：|参数列表| -> 返回类型 { 函数体 }
    let add_one = |x: i32| -> i32 { x + 1 };
    println!("add_one(5) = {}", add_one(5));

    // 类型可以省略（编译器推断）
    let add_two = |x| x + 2;
    println!("add_two(5) = {}", add_two(5));

    // 没有参数的闭包
    let hello = || println!("你好！");
    hello();

    // ---- 闭包捕获环境 ----
    let x = 10;
    let add_x = |y| x + y; // 捕获 x
    println!("add_x(5) = {}", add_x(5)); // 15

    // ---- 闭包作为参数 ----
    fn apply<F>(f: F, x: i32) -> i32
    where
        F: Fn(i32) -> i32,
    {
        f(x)
    }

    let double = |x| x * 2;
    println!("apply(double, 5) = {}", apply(double, 5));

    // ---- 闭包作为返回值 ----
    fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
        move |y| x + y // move 关键字：强制获取 x 的所有权
    }

    let adder = make_adder(10);
    println!("adder(5) = {}", adder(5)); // 15

    // ---- 三种 Fn trait ----
    // FnOnce：获取环境变量的所有权，只能调用一次
    // FnMut：可变借用环境变量
    // Fn：不可变借用环境变量

    let s = String::from("hello");

    // Fn：不可变借用
    let fn_closure = || println!("Fn: {}", s);
    fn_closure();
    fn_closure(); // 可以多次调用
    println!("s 仍然可用: {}", s);

    // FnMut：可变借用
    let mut list = vec![1, 2, 3];
    let mut fn_mut_closure = || {
        list.push(4);
        println!("FnMut: {:?}", list);
    };
    fn_mut_closure();
    // fn_mut_closure(); // 可以再次调用

    // FnOnce：获取所有权
    let s2 = String::from("world");
    let fn_once_closure = || {
        drop(s2); // 获取所有权
    };
    fn_once_closure();
    // fn_once_closure(); // 编译错误！s2 已被释放
}
