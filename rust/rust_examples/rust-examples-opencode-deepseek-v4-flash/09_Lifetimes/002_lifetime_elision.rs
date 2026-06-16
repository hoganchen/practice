// ============================================================
// Rust 知识点：生命周期省略规则（Lifetime Elision）
// 编译器自动推断生命周期，减少手动标注
// 编译：rustc 002_lifetime_elision.rs && .\002_lifetime_elision.exe
// ============================================================

// ---- 三条省略规则 ----
// 1. 每个输入引用获得一个独立的生命周期参数
// 2. 如果只有一个输入生命周期，它被赋给所有输出引用
// 3. 如果有多个输入生命周期，但其中一个 &self 或 &mut self，则 self 的生命周期赋给所有输出引用

// ---- 规则 1 示例：输入引用各自获得生命周期 ----
// 无需标注
fn first_char(s: &str) -> Option<char> {
    s.chars().next()
}

// ---- 规则 2 示例：单一输入，输出使用同一生命周期 ----
// 无需标注
fn identity(s: &str) -> &str {
    s
}

// ---- 规则 3 示例：&self 方法 ----
struct Book {
    title: String,
    author: String,
}

impl Book {
    // 无需标注：输出引用使用 &self 的生命周期
    fn get_title(&self) -> &str {
        &self.title
    }

    fn get_author(&self) -> &str {
        &self.author
    }
}

// ---- 需要手动标注的场景 ----
// 多个输入引用，且返回值与其中之一相关
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() >= y.len() { x } else { y }
}

// ---- 方法中的生命周期 ----
impl Book {
    // 多输入引用时需要手动标注
    fn compare_titles<'a>(&'a self, other: &'a Book) -> &'a str {
        if self.title.len() >= other.title.len() {
            &self.title
        } else {
            &other.title
        }
    }
}

fn main() {
    // 验证省略规则正常工作
    let s = String::from("hello");
    println!("第一个字符: {:?}", first_char(&s));
    println!("identity: {}", identity(&s));

    let book1 = Book {
        title: String::from("Rust 编程"),
        author: String::from("作者 A"),
    };

    let book2 = Book {
        title: String::from("Go 语言"),
        author: String::from("作者 B"),
    };

    println!("书名: {}", book1.get_title());
    println!("较长书名: {}", book1.compare_titles(&book2));
}
