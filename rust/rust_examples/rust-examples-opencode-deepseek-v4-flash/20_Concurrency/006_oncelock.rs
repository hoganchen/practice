// ============================================================
// Rust 知识点：OnceLock / OnceCell / LazyLock —— 一次性初始化
// Rust 1.70+ 稳定
// 编译：rustc 006_oncelock.rs && .\006_oncelock.exe
// ============================================================

use std::sync::{LazyLock, OnceLock};
use std::thread;
use std::time::Duration;

// ---- 全局惰性初始化（sync） ----
static GLOBAL_CONFIG: LazyLock<Config> = LazyLock::new(|| {
    println!("全局配置首次初始化...");
    Config::load()
});

static GLOBAL_CACHE: OnceLock<String> = OnceLock::new();

#[derive(Debug)]
struct Config {
    host: String,
    port: u16,
}

impl Config {
    fn load() -> Self {
        // 模拟读取配置文件
        thread::sleep(Duration::from_millis(10));
        Config {
            host: String::from("127.0.0.1"),
            port: 8080,
        }
    }
}

// ---- OnceLock 的基本使用 ----
fn get_cache() -> &'static String {
    GLOBAL_CACHE.get_or_init(|| {
        println!("初始化缓存...");
        String::from("大数据缓存内容")
    })
}

// ---- 线程安全的一次性初始化 ----
fn thread_safe_init() {
    let lock = OnceLock::new();
    let mut handles = vec![];

    for i in 0..5 {
        let handle = thread::spawn(move || {
            // 多个线程同时尝试初始化，只有第一个成功
            let value = lock.get_or_init(|| {
                println!("线程 {} 成功初始化！", i);
                format!("线程 {} 的值", i)
            });
            println!("线程 {} 获取: {}", i, value);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
}

// ---- 非线程安全的 OnceCell ----
fn once_cell_example() {
    use std::cell::OnceCell;

    let cell = OnceCell::new();
    cell.set("hello").unwrap();
    // cell.set("world"); // panic！不能重复设置
    assert_eq!(cell.get(), Some(&"hello"));
    println!("OnceCell: {:?}", cell.get());
}

fn main() {
    // ---- LazyLock 全局变量 ----
    println!("=== LazyLock 全局变量 ===");
    println!("还没访问 GLOBAL_CONFIG...");
    thread::sleep(Duration::from_millis(20));

    // 首次访问时初始化
    println!("配置: {:?}", *GLOBAL_CONFIG);
    // 再次访问不会重新初始化
    println!("配置: {:?}", *GLOBAL_CONFIG);

    // ---- OnceLock 全局缓存 ----
    println!("\n=== OnceLock 全局缓存 ===");
    println!("缓存: {}", get_cache());
    println!("缓存: {}", get_cache()); // 不会重复初始化

    // ---- 线程安全的一次性初始化 ----
    println!("\n=== 线程安全 OnceLock ===");
    thread_safe_init();

    // ---- 非线程安全 OnceCell ----
    println!("\n=== OnceCell ===");
    once_cell_example();

    // ---- OnceLock 的实用示例 ----
    println!("\n=== 实用: 数据库连接池 ===");
    static DB_CONNECTION: OnceLock<String> = OnceLock::new();

    fn get_db_url() -> &'static str {
        DB_CONNECTION.get_or_init(|| {
            String::from("postgres://user:pass@localhost/db")
        })
    }

    println!("数据库: {}", get_db_url());

    // ---- LazyLock 的实用示例 ----
    println!("\n=== 实用: 正则表达式缓存 ===");
    static RE: LazyLock<regex_lite::Regex> = LazyLock::new(|| {
        regex_lite::Regex::new(r"\d+").unwrap()
    });

    println!("正则匹配: {}", RE.is_match("hello 123 world"));
    // 注意：regex-lite 是轻量版，实际项目用 regex crate
}
