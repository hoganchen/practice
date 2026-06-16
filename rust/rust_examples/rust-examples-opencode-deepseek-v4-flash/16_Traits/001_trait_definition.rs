// ============================================================
// Rust 知识点：Trait 定义与实现 —— 定义共享行为
// trait 类似于其他语言的接口（interface）
// 编译：rustc 001_trait_definition.rs && .\001_trait_definition.exe
// ============================================================

// ---- 定义 trait ----
trait Speak {
    // 方法签名（必须实现）
    fn speak(&self) -> String;

    // 提供默认实现（可选覆盖）
    fn greet(&self) -> String {
        format!("你好！{}", self.speak())
    }
}

// ---- 为不同类型实现 trait ----
struct Dog {
    name: String,
}

struct Cat {
    name: String,
}

impl Speak for Dog {
    fn speak(&self) -> String {
        format!("{} 说: 汪汪！", self.name)
    }

    // 覆盖默认实现
    fn greet(&self) -> String {
        format!("{} 摇着尾巴说: 汪汪！", self.name)
    }
}

impl Speak for Cat {
    fn speak(&self) -> String {
        format!("{} 说: 喵喵！", self.name)
    }
    // greet 使用默认实现
}

// ---- 为内置类型实现自己的 trait ----
trait Summary {
    fn summary(&self) -> String;
}

impl Summary for String {
    fn summary(&self) -> String {
        if self.len() > 10 {
            format!("{}...", &self[..10])
        } else {
            self.clone()
        }
    }
}

impl Summary for i32 {
    fn summary(&self) -> String {
        format!("数字: {}", self)
    }
}

// ---- trait 作为参数 ----
fn make_speak(item: &impl Speak) {
    println!("{}", item.speak());
}

// 或使用泛型约束语法
fn make_greet<T: Speak>(item: &T) {
    println!("{}", item.greet());
}

// ---- 返回实现了 trait 的类型 ----
fn create_dog() -> impl Speak {
    Dog {
        name: String::from("旺财"),
    }
}

fn main() {
    let dog = Dog {
        name: String::from("旺财"),
    };
    let cat = Cat {
        name: String::from("咪咪"),
    };

    println!("{}", dog.speak());
    println!("{}", dog.greet());
    println!("{}", cat.speak());
    println!("{}", cat.greet());

    // 内置类型实现 trait
    let s = String::from("Hello, Rust World!");
    println!("字符串摘要: {}", s.summary());
    println!("{}", 42.summary());

    // trait 作为参数
    make_speak(&dog);
    make_greet(&cat);

    // 返回 trait
    let d = create_dog();
    println!("{}", d.speak());
}
