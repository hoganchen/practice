// ============================================================
// Rust 知识点：Cow（Clone-on-Write）写时克隆智能指针
// 用于在"读取大多数、修改少数"场景下优化性能
// 编译：rustc 004_cow.rs && .\004_cow.exe
// ============================================================

use std::borrow::Cow;

// ---- Cow 的定义 ----
// enum Cow<'a, B: ?Sized + ToOwned> {
//     Borrowed(&'a B),  // 借用的引用
//     Owned(<B as ToOwned>::Owned), // 拥有所有权的数据
// }

// ---- 使用 Cow 优化字符串处理 ----
fn normalize_name(name: &str) -> Cow<'_, str> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        Cow::Borrowed("unknown") // 返回借用（避免分配）
    } else if trimmed == name {
        Cow::Borrowed(name) // 返回借用（没有变化）
    } else {
        // 需要修改时，才创建新的 String
        let mut s = String::from("User: ");
        s.push_str(trimmed);
        Cow::Owned(s)
    }
}

// ---- Cow 的 to_mut —— 需要修改时克隆 ----
fn ensure_capitalized(name: &mut Cow<str>) {
    if !name.is_empty() && !name.chars().next().unwrap().is_uppercase() {
        // to_mut() 会在 Borrowed 时克隆，在 Owned 时直接修改
        let s = name.to_mut();
        let first = s.chars().next().unwrap();
        *s = first.to_uppercase().to_string() + &s[first.len_utf8()..];
    }
}

// ---- Cow 在集合中使用 ----
fn dedup_prefix<'a>(words: &'a [String]) -> Vec<Cow<'a, str>> {
    let mut result = Vec::new();
    let mut prev: Option<&'a str> = None;

    for word in words {
        if prev.map_or(true, |p| !word.starts_with(p)) {
            result.push(Cow::Borrowed(word.as_str()));
            prev = Some(word);
        } else {
            result.push(Cow::Owned(format!("  -> {}", word)));
        }
    }
    result
}

fn main() {
    // ---- Cow 的基本使用 ----
    let borrowed: Cow<str> = Cow::Borrowed("hello");
    let owned: Cow<str> = Cow::Owned(String::from("world"));

    println!("Borrowed: {}", borrowed);
    println!("Owned: {}", owned);

    // ---- 避免不必要的分配 ----
    println!("\n=== 避免分配 ===");
    let already_normal = "Alice";
    let result = normalize_name(already_normal);
    println!("无需修改: {}", result);
    println!("是否借用: {}", matches!(result, Cow::Borrowed(_)));

    let need_normal = "  Bob  ";
    let result = normalize_name(need_normal);
    println!("需要修改: {}", result);
    println!("是否借用: {}", matches!(result, Cow::Owned(_)));

    let empty = "";
    let result = normalize_name(empty);
    println!("空字符串: {}", result);
    println!("是否借用: {}", matches!(result, Cow::Borrowed(_)));

    // ---- Cow::to_mut —— 延迟克隆 ----
    println!("\n=== to_mut 延迟克隆 ===");
    let name = "alice"; // &str，没有所有权的数据
    let mut cow = Cow::Borrowed(name);

    // 此时没有分配，只是借用
    ensure_capitalized(&mut cow);
    println!("capitalized: {}", cow); // "Alice"

    // ---- Cow 与 match 模式匹配 ----
    println!("\n=== match 模式匹配 ===");
    let val: Cow<str> = Cow::Borrowed("match_me");
    match val {
        Cow::Borrowed(s) => println!("借用的: {}", s),
        Cow::Owned(s) => println!("拥有的: {}", s),
    }

    // ---- Cow 在集合中的应用 ----
    println!("\n=== 集合中应用 ===");
    let words = vec![
        "rust".to_string(),
        "rustacean".to_string(),
        "rustic".to_string(),
        "go".to_string(),
        "gopher".to_string(),
    ];

    let processed = dedup_prefix(&words);
    for item in &processed {
        match item {
            Cow::Borrowed(s) => println!("  [借] {}", s),
            Cow::Owned(s) => println!("  [有] {}", s),
        }
    }
}
