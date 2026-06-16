// ============================================================
// Rust 知识点：所有权（Ownership）—— Rust 最核心的特性
// 规则：
//   1. Rust 中每个值都有一个所有者（owner）
//   2. 同一时间只有一个所有者
//   3. 所有者离开作用域时，值被自动释放（drop）
// 编译：rustc 001_ownership_basics.rs && .\001_ownership_basics.exe
// ============================================================

fn main() {
    // ---- 所有权规则示例 ----
    // String 类型（堆分配的数据）受所有权规则约束
    let s1 = String::from("hello"); // s1 是所有者
    let s2 = s1;                    // 所有权从 s1 移动到 s2
    // println!("{}", s1);           // 编译错误！s1 不再拥有该值
    println!("s2 = {}", s2);        // s2 现在是所有者

    // ---- 基本类型（栈数据）不受所有权影响 ----
    let x = 5;
    let y = x;                      // 复制（Copy），不是移动
    println!("x = {}, y = {}", x, y); // 两者都可用

    // ---- 函数传参也会转移所有权 ----
    let s3 = String::from("world");
    take_ownership(s3);             // s3 的所有权被移动到函数中
    // println!("{}", s3);          // 编译错误！s3 不再有效

    // ---- 函数返回值也会转移所有权 ----
    let s4 = give_ownership();      // 函数返回的 String 所有权给到 s4
    println!("s4 = {}", s4);

    // ---- 传参并返回以保留所有权 ----
    let s5 = String::from("rust");
    let s5 = take_and_give_back(s5); // 传进去，再还回来
    println!("s5 仍有效: {}", s5);
}

fn take_ownership(some_string: String) {
    println!("接收所有权: {}", some_string);
} // 这里 some_string 被 drop（释放）

fn give_ownership() -> String {
    let s = String::from("从函数返回");
    s // 返回所有权给调用者
}

fn take_and_give_back(s: String) -> String {
    println!("接收并返回: {}", s);
    s // 返回所有权
}
