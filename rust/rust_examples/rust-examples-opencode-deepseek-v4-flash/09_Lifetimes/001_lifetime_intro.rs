// ============================================================
// Rust 知识点：生命周期（Lifetime）基础
// 生命周期确保引用在有效期内使用，防止悬垂引用
// 编译：rustc 001_lifetime_intro.rs && .\001_lifetime_intro.exe
// ============================================================

// ---- 生命周期标注语法 ----
// `'a` 是生命周期参数，`'` + 小写名称
// 函数签名中的生命周期表示参数和返回值之间的关联

// 显式生命周期标注：返回值的生命周期与两个参数中较短的一致
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// ---- 多个生命周期参数 ----
fn first_and_second<'a, 'b>(first: &'a str, _second: &'b str) -> &'a str {
    first // 返回值的生命周期与 first 相同
}

fn main() {
    // ---- 生命周期确保引用有效 ----
    let string1 = String::from("长字符串");
    let result;

    {
        let string2 = String::from("短");
        // string2 的生命周期到内部作用域结束
        result = longest(&string1, &string2);
        println!("最长的字符串: {}", result);
    } // string2 在这里 drop

    // println!("{}", result); // 潜在危险！但 Rust 不允许

    // ---- 不同生命周期示例 ----
    let s1 = String::from("hello");
    let s2 = "world"; // &str 字面量，生命周期是 'static

    let r = longest(&s1, s2);
    println!("结果: {}", r);

    // ---- 生命周期省略规则 ----
    // 某些情况下可以省略生命周期标注（见下例）
    fn first_word(s: &str) -> &str {
        // 编译器自动添加生命周期
        s.split_whitespace().next().unwrap_or("")
    }
    let words = "hello world rust";
    let word = first_word(words);
    println!("第一个单词: {}", word);
}
