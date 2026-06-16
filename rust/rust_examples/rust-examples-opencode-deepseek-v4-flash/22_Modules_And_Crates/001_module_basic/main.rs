// ============================================================
// Rust 知识点：模块系统 —— mod、pub、use
// 编译：rustc main.rs && .\main.exe
// ============================================================

// ---- 内联模块 ----
mod math {
    // 默认 items 是私有的
    fn private_add(x: i32, y: i32) -> i32 {
        x + y
    }

    // `pub` 使其公开
    pub fn add(x: i32, y: i32) -> i32 {
        x + y
    }

    // pub(crate)：仅当前 crate 可见
    pub(crate) fn internal_add(x: i32, y: i32) -> i32 {
        x + y
    }

    // 公有结构体，字段默认私有
    pub struct Calculator {
        pub name: String,      // 公有字段
        version: u32,          // 私有字段
    }

    impl Calculator {
        pub fn new(name: &str) -> Calculator {
            Calculator {
                name: name.to_string(),
                version: 1,
            }
        }

        pub fn add(&self, x: i32, y: i32) -> i32 {
            x + y
        }
    }
}

// ---- 使用 use 导入 ----
use math::add;
use math::Calculator;

// ---- 使用 as 重命名 ----
use math::internal_add as internal_add;

fn main() {
    // 使用 pub 函数
    let result = add(5, 3);
    println!("add: {}", result);

    // 使用重命名的函数
    let result = internal_add(10, 20);
    println!("internal_add: {}", result);

    // 使用模块中的结构体
    let calc = Calculator::new("我的计算器");
    println!("计算器: {}", calc.name);
    println!("计算: {}", calc.add(10, 20));

    // ---- 子模块 ----
    mod greetings {
        pub mod formal {
            pub fn hello() -> String {
                String::from("您好！")
            }
        }

        pub mod informal {
            pub fn hello() -> String {
                String::from("嗨！")
            }
        }
    }

    // 完整路径
    println!("{}", greetings::formal::hello());
    println!("{}", greetings::informal::hello());

    // 使用 use 简化
    use greetings::formal;
    use greetings::informal;
    println!("{}", formal::hello());
    println!("{}", informal::hello());

    // ---- self 和 super ----
    mod nested {
        pub fn function() -> &'static str {
            "nested::function"
        }

        pub mod inner {
            pub fn function() -> &'static str {
                // super 指向父模块（nested）
                super::function()
            }

            pub fn call_self() -> &'static str {
                // self 指向当前模块（inner）
                self::function()
            }
        }
    }

    println!("{}", nested::inner::function());
    println!("{}", nested::inner::call_self());
}
