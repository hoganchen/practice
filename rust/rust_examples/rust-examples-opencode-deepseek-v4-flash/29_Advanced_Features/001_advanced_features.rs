// ============================================================
// Rust 知识点：高级特性 —— let-else, let chains, offset_of!
// 这些是 Rust 近几个版本引入的语法糖
// 编译：rustc 001_advanced_features.rs && .\001_advanced_features.exe
// ============================================================

fn main() {
    // ========== let-else（Rust 1.65+） ==========
    // 模式匹配失败时提前返回/退出

    fn get_first_element(items: &[i32]) -> i32 {
        let [first, ..] = items else {
            // 如果 items 是空切片，执行这个分支
            panic!("数组为空！");
        };
        *first
    }

    println!("第一个元素: {}", get_first_element(&[1, 2, 3]));

    fn try_parse(s: &str) {
        let Ok(num) = s.parse::<i32>() else {
            println!("无法解析: {}", s);
            return;
        };
        println!("成功解析: {}", num);
    }

    try_parse("42");
    try_parse("abc");

    // ========== let chains（Rust 1.77+ 实验性，部分稳定） ==========
    // 在 if 条件中链式使用 let
    // 使用 let 和 && 组合多个模式匹配

    struct Config {
        value: Option<String>,
        debug: bool,
    }

    fn process_config(config: &Config) {
        // 传统写法
        if let Some(val) = &config.value {
            if config.debug {
                println!("调试: {}", val);
            }
        }

        // let chain 写法（如果支持）
        // if let Some(val) = &config.value && config.debug {
        //     println!("let chain 调试: {}", val);
        // }
    }

    let config = Config {
        value: Some(String::from("test")),
        debug: true,
    };
    process_config(&config);

    // ========== offset_of! 宏（Rust 1.77+） ==========
    // 获取结构体字段的偏移量
    // 需要启用 #![allow(internal_features)]

    #[repr(C)]
    struct Point {
        x: f64,
        y: f64,
        z: f64,
    }

    // 取消注释需要 nightly Rust 或 Rust 1.77+
    // println!("x 偏移: {}", std::mem::offset_of!(Point, x));
    // println!("y 偏移: {}", std::mem::offset_of!(Point, y));

    println!("offset_of! 需要 Rust 1.77+");

    // ========== return position impl Trait（RPIT） ==========
    fn make_iterator() -> impl Iterator<Item = i32> {
        0..5
    }

    let iter = make_iterator();
    println!("RPIT 迭代器: {:?}", iter.collect::<Vec<_>>());

    // ========== async fn in traits（Rust 1.75+） ==========
    // async fn 可以在 trait 中定义了（需要 #[async_trait] 宏或原生支持）

    // ========== 匿名生命周期（Rust 1.77+） ==========
    // 使用 '_ 替代显式生命周期标注（某些上下文）
    struct RefStruct<'a> {
        data: &'a str,
    }

    // 省略生命周期（编译器可以推断时）
    fn process_ref(data: &str) -> &str {
        data
    }

    println!("省略生命周期: {}", process_ref("hello"));

    // ========== 关联类型默认值（需要 nightly #![feature(associated_type_defaults)]） ==========
    // trait DefaultAssoc {
    //     type Item = i32; // 默认关联类型（实验性功能）
    //     fn get(&self) -> Self::Item;
    // }
    //
    // struct MyType;
    //
    // impl DefaultAssoc for MyType {
    //     fn get(&self) -> i32 { 42 }
    // }
    //
    // let my = MyType;
    // println!("默认关联类型: {}", my.get());
}
