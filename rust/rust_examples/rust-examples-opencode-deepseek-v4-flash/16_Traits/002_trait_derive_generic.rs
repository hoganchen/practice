// ============================================================
// Rust 知识点：派生 trait（Derive）、trait 继承、关联类型
// 编译：rustc 002_trait_derive_generic.rs && .\002_trait_derive_generic.exe
// ============================================================

// ========== 派生 trait ==========
// #[derive] 属性让编译器自动实现常见 trait
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct User {
    id: u32,
    name: String,
}

// ========== trait 继承（Supertrait） ==========
trait Printable: std::fmt::Display {
    fn print(&self) {
        println!("{}", self.to_string());
    }
}

struct Article {
    title: String,
}

// Display 是 Printable 的前提条件
impl std::fmt::Display for Article {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "文章: {}", self.title)
    }
}

impl Printable for Article {}

// ========== 关联类型（Associated Types） ==========
trait Container {
    type Item; // 关联类型（由实现者指定）

    fn add(&mut self, item: Self::Item);
    fn get(&self, index: usize) -> Option<&Self::Item>;
}

struct MyCollection<T> {
    items: Vec<T>,
}

impl<T> Container for MyCollection<T> {
    type Item = T;

    fn add(&mut self, item: T) {
        self.items.push(item);
    }

    fn get(&self, index: usize) -> Option<&T> {
        self.items.get(index)
    }
}

// ========== 默认泛型类型参数 ==========
trait Add<RHS = Self> {
    // RHS 的默认类型是 Self
    type Output;
    fn add(self, rhs: RHS) -> Self::Output;
}

fn main() {
    // ---- 派生 trait 的使用 ----
    let user1 = User {
        id: 1,
        name: String::from("Alice"),
    };
    let user2 = user1.clone(); // Clone
    let user3 = User {
        id: 1,
        name: String::from("Alice"),
    };

    println!("user1 = {:?}", user1);  // Debug
    println!("user1 == user3: {}", user1 == user3); // PartialEq

    // ---- trait 继承 ----
    let article = Article {
        title: String::from("Rust 学习"),
    };
    article.print();

    // ---- 关联类型 ----
    let mut collection = MyCollection { items: Vec::new() };
    collection.add(1);
    collection.add(2);
    collection.add(3);

    if let Some(item) = collection.get(1) {
        println!("index 1: {}", item);
    }
}
