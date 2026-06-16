// ============================================================
// Rust 知识点：Borrow/AsRef/ToOwned —— 引用语义 trait
// 编译：rustc 005_borrow_asref.rs && .\005_borrow_asref.exe
// ============================================================

use std::borrow::{Borrow, ToOwned};

// ========== AsRef<T> —— 转换为引用 ==========
// 用于将类型转换为某个类型的引用（零开销抽象）

fn count_chars(s: &str) -> usize {
    s.chars().count()
}

// 接受任何可以转换为 &str 的类型
fn count_chars_generic<T: AsRef<str>>(s: T) -> usize {
    s.as_ref().chars().count()
}

// ========== Borrow<T> —— 借用语义 ==========
// Borrow 要求返回的引用与原值的 Hash、Eq 一致
// AsRef 没有这个保证

fn print_borrowed<T: Borrow<str>>(s: T) {
    println!("Borrow: {}", s.borrow());
}

// HashMap 的 get 方法使用 Borrow trait
use std::collections::HashMap;

// ========== ToOwned —— 由借用到所有 ==========
// 通过借用创建拥有所有权的值（Clone 的泛化版本）

fn to_owned_example() {
    // str -> String, [T] -> Vec<T>, Path -> PathBuf
    let s: &str = "hello";
    let owned: String = s.to_owned(); // 通过 ToOwned

    let slice: &[i32] = &[1, 2, 3];
    let vec: Vec<i32> = slice.to_owned();

    println!("to_owned: str -> String: {}", owned);
    println!("to_owned: &[i32] -> Vec: {:?}", vec);
}

fn main() {
    // ---- AsRef 使用 ----
    let s = String::from("Hello Rust");
    println!("AsRef<str> from String: {}", count_chars_generic(&s));

    let s2 = "hello world";
    println!("AsRef<str> from &str: {}", count_chars_generic(s2));

    // AsRef 链：String -> &str -> &[u8]
    let bytes: &[u8] = s.as_ref(); // String 实现了 AsRef<[u8]>
    println!("AsRef<[u8]>: {:?}", bytes);

    // ---- AsRef + Path ----
    use std::path::Path;
    fn open_file<P: AsRef<Path>>(path: P) {
        let path = path.as_ref();
        println!("Path: {}", path.display());
    }

    open_file("/tmp/file.txt");
    open_file(String::from("/tmp/another.txt"));

    // ---- Borrow 使用 ----
    let name = String::from("Alice");
    print_borrowed(name);

    // ---- Borrow 在 HashMap 中的使用 ----
    let mut map: HashMap<String, i32> = HashMap::new();
    map.insert("key1".to_string(), 100);
    map.insert("key2".to_string(), 200);

    // get 方法使用 Borrow
    // &String 作为 key 时，可以传入 &str
    if let Some(val) = map.get("key1") {
        println!("HashMap get: {}", val);
    }

    // ---- Borrow 与 Eq/Hash 的一致性 ----
    fn check_consistency<T: Borrow<str> + std::fmt::Debug>(val: T) {
        let owned = val.borrow().to_string();
        println!("{:?} Borrow 为: {}", val, owned);
    }

    check_consistency(String::from("test"));

    // ---- ToOwned 示例 ----
    to_owned_example();

    // ---- 实际应用场景 ----
    // 函数同时接受 &str 和 String
    fn process<T: AsRef<str>>(input: T) {
        let s = input.as_ref();
        println!("处理: {}", s);
    }

    process("&str 直接传入");
    process(String::from("String 传入"));
    process(&String::from("&String 传入"));
}
