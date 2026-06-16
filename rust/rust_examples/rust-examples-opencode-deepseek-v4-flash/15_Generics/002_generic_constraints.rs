// ============================================================
// Rust 知识点：泛型约束（Trait Bounds）和 where 子句
// 编译：rustc 002_generic_constraints.rs && .\002_generic_constraints.exe
// ============================================================

use std::cmp::PartialOrd;
use std::fmt::{Debug, Display};

// ---- 使用 where 子句（更清晰） ----
fn find_max<T>(a: T, b: T) -> T
where
    T: PartialOrd + Display,
{
    if a > b {
        println!("较大值: {}", a);
        a
    } else {
        println!("较大值: {}", b);
        b
    }
}

// ---- 多种约束组合 ----
fn compare_and_display<T, U>(t: &T, u: &U)
where
    T: Display + Debug,
    U: Display + Debug,
{
    println!("t = {}, t debug = {:?}", t, t);
    println!("u = {}, u debug = {:?}", u, u);
}

// ---- 返回实现了某 trait 的类型 ----
fn make_pair<T, U>(t: T, u: U) -> (T, U) {
    (t, u)
}

// ---- 使用 trait 约束作为参数 ----
fn notify(item: &impl Display) {
    println!("通知: {}", item);
}

// 等同于：
fn notify2<T: Display>(item: &T) {
    println!("通知2: {}", item);
}

// ---- 多个 trait 约束 ----
fn display_and_debug(item: &(impl Display + Debug)) {
    println!("Display: {}", item);
    println!("Debug: {:?}", item);
}

// ========== 约束在 impl 块中 ==========
#[derive(Debug)]
struct Pair<T> {
    x: T,
    y: T,
}

impl<T: Display + PartialOrd> Pair<T> {
    fn display_ordered(&self) {
        if self.x > self.y {
            println!("x > y: {} > {}", self.x, self.y);
        } else {
            println!("x <= y: {} <= {}", self.x, self.y);
        }
    }
}

// ---- 条件约束方法 ----
impl<T: Display> Pair<T> {
    fn display(&self) {
        println!("Pair: {}, {}", self.x, self.y);
    }
}

fn main() {
    // 使用带约束的泛型
    println!("{}", find_max(10, 20));
    println!("{}", find_max(3.14, 2.71));

    compare_and_display(&42, &"hello");

    notify(&100);
    display_and_debug(&"test");

    let pair = Pair { x: 5, y: 10 };
    pair.display();
    pair.display_ordered();
}
