// ============================================
// 知识点：常用 Crate 使用示例
// 难度：中级
// ============================================

// 本示例展示常用 crate 的基本用法
// 注意：需要在 Cargo.toml 中添加依赖

fn main() {
    println!("=== 常用 Crate 使用示例 ===");
    
    // ==================== serde：序列化/反序列化 ====================
    println!("\n=== serde ===");
    
    // serde 用于数据序列化和反序列化
    // 支持 JSON, YAML, TOML, MessagePack 等格式
    
    println!("serde 常用功能:");
    println!("  #[derive(Serialize, Deserialize)]");
    println!("  #[serde(rename = \"...\")]");
    println!("  #[serde(default)]");
    println!("  #[serde(skip)]");
    
    // 示例代码（需要 serde 和 serde_json）
    // use serde::{Serialize, Deserialize};
    // use serde_json;
    //
    // #[derive(Serialize, Deserialize, Debug)]
    // struct User {
    //     name: String,
    //     age: u32,
    //     #[serde(default)]
    //     active: bool,
    // }
    //
    // let user = User {
    //     name: "Alice".to_string(),
    //     age: 30,
    //     active: true,
    // };
    //
    // // 序列化为 JSON
    // let json = serde_json::to_string(&user).unwrap();
    // println!("JSON: {}", json);
    //
    // // 从 JSON 反序列化
    // let user: User = serde_json::from_str(&json).unwrap();
    // println!("User: {:?}", user);
    
    // ==================== tokio：异步运行时 ====================
    println!("\n=== tokio ===");
    
    // tokio 是最流行的异步运行时
    // 提供异步 I/O、定时器、通道等
    
    println!("tokio 常用功能:");
    println!("  #[tokio::main]");
    println!("  #[tokio::test]");
    println!("  tokio::spawn");
    println!("  tokio::time::sleep");
    println!("  tokio::fs::read_to_string");
    
    // 示例代码（需要 tokio）
    // use tokio::time::{sleep, Duration};
    //
    // #[tokio::main]
    // async fn main() {
    //     println!("Hello from tokio!");
    //     sleep(Duration::from_millis(100)).await;
    //     println!("After sleep");
    // }
    
    // ==================== reqwest：HTTP 客户端 ====================
    println!("\n=== reqwest ===");
    
    // reqwest 是用于 HTTP 请求的库
    // 支持同步和异步
    
    println!("reqwest 常用功能:");
    println!("  reqwest::get");
    println!("  reqwest::Client::new");
    println!("  client.post");
    println!("  client.get");
    
    // 示例代码（需要 reqwest）
    // #[tokio::main]
    // async fn main() -> Result<(), reqwest::Error> {
    //     let resp = reqwest::get("https://httpbin.org/get").await?;
    //     println!("Status: {}", resp.status());
    //     let body = resp.text().await?;
    //     println!("Body: {}", body);
    //     Ok(())
    // }
    
    // ==================== clap：命令行参数解析 ====================
    println!("\n=== clap ===");
    
    // clap 用于解析命令行参数
    // 提供 derive 和 builder 两种 API
    
    println!("clap 常用功能:");
    println!("  #[derive(Parser)]");
    println!("  #[command]");
    println!("  #[arg]");
    println!("  Args::parse()");
    
    // 示例代码（需要 clap）
    // use clap::Parser;
    //
    // #[derive(Parser)]
    // #[command(name = "myapp")]
    // #[command(about = "示例应用")]
    // struct Args {
    //     /// 输入文件
    //     #[arg(short, long)]
    //     input: String,
    //
    //     /// 输出文件
    //     #[arg(short, long)]
    //     output: Option<String>,
    //
    //     /// 详细模式
    //     #[arg(short, long)]
    //     verbose: bool,
    // }
    //
    // fn main() {
    //     let args = Args::parse();
    //     println!("Input: {}", args.input);
    //     println!("Output: {:?}", args.output);
    //     println!("Verbose: {}", args.verbose);
    // }
    
    // ==================== log + env_logger：日志 ====================
    println!("\n=== log + env_logger ===");
    
    // log 定义日志接口
    // env_logger 提供环境变量配置的日志实现
    
    println!("log 常用功能:");
    println!("  log::info!");
    println!("  log::warn!");
    println!("  log::error!");
    println!("  log::debug!");
    
    println!("env_logger 配置:");
    println!("  RUST_LOG=info");
    println!("  RUST_LOG=myapp=debug");
    println!("  RUST_LOG=warn,myapp=info");
    
    // 示例代码
    // use log::{info, warn, error, debug};
    //
    // fn main() {
    //     env_logger::init();
    //
    //     info!("This is an info message");
    //     warn!("This is a warning");
    //     error!("This is an error");
    //     debug!("This is a debug message");
    // }
    
    // ==================== chrono：日期时间 ====================
    println!("\n=== chrono ===");
    
    // chrono 用于日期和时间处理
    
    println!("chrono 常用功能:");
    println!("  Utc::now()");
    println!("  Local::now()");
    println!("  NaiveDate::from_ymd_opt");
    println!("  DateTime::parse_from_rfc3339");
    
    // 示例代码（需要 chrono）
    // use chrono::{Utc, Local, NaiveDate, DateTime};
    //
    // fn main() {
    //     let utc_now = Utc::now();
    //     println!("UTC: {}", utc_now);
    //
    //     let local_now = Local::now();
    //     println!("Local: {}", local_now);
    //
    //     let date = NaiveDate::from_ymd_opt(2024, 1, 1).unwrap();
    //     println!("Date: {}", date);
    // }
    
    // ==================== regex：正则表达式 ====================
    println!("\n=== regex ===");
    
    // regex 用于正则表达式匹配
    
    println!("regex 常用功能:");
    println!("  Regex::new");
    println!("  re.is_match");
    println!("  re.find");
    println!("  re.captures");
    
    // 示例代码（需要 regex）
    // use regex::Regex;
    //
    // fn main() {
    //     let re = Regex::new(r"(\d{4})-(\d{2})-(\d{2})").unwrap();
    //
    //     let text = "今天是 2024-01-15";
    //     if let Some(caps) = re.captures(text) {
    //         println!("Year: {}", &caps[1]);
    //         println!("Month: {}", &caps[2]);
    //         println!("Day: {}", &caps[3]);
    //     }
    // }
    
    // ==================== rand：随机数 ====================
    println!("\n=== rand ===");
    
    // rand 用于生成随机数
    
    println!("rand 常用功能:");
    println!("  rand::thread_rng()");
    println!("  rng.gen()");
    println!("  rng.gen_range(1..=100)");
    println!("  rng.gen_bool(0.5)");
    
    // 示例代码（需要 rand）
    // use rand::Rng;
    //
    // fn main() {
    //     let mut rng = rand::thread_rng();
    //
    //     let n: i32 = rng.gen();
    //     println!("Random: {}", n);
    //
    //     let n: i32 = rng.gen_range(1..=100);
    //     println!("Range: {}", n);
    //
    //     let b: bool = rng.gen_bool(0.7);
    //     println!("Bool: {}", b);
    // }
    
    // ==================== num：数值计算 ====================
    println!("\n=== num ===");
    
    // num 提供数值计算 trait 和函数
    
    println!("num 常用功能:");
    println!("  num::Zero");
    println!("  num::One");
    println!("  num::Float");
    println!("  num::Complex");
    
    // 示例代码（需要 num）
    // use num::Complex;
    //
    // fn main() {
    //     let c1 = Complex::new(1.0, 2.0);
    //     let c2 = Complex::new(3.0, 4.0);
    //
    //     let sum = c1 + c2;
    //     println!("Sum: {}", sum);
    //
    //     let product = c1 * c2;
    //     println!("Product: {}", product);
    // }
    
    // ==================== 总结 ====================
    println!("\n=== 总结 ===");
    
    println!("常用 crate 选择:");
    println!("  序列化: serde");
    println!("  异步: tokio");
    println!("  HTTP: reqwest");
    println!("  命令行: clap");
    println!("  日志: log + env_logger");
    println!("  日期时间: chrono");
    println!("  正则: regex");
    println!("  随机数: rand");
    println!("  数值: num");
    println!("  错误: anyhow, thiserror");
    println!("  配置: config");
    println!("  数据库: sqlx, diesel");
    
    println!("\n常用 Crate 使用示例完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_common_crates.rs -o 01_common_crates.exe
//   01_common_crates.exe
//
// Linux/macOS:
//   rustc 01_common_crates.rs -o 01_common_crates
//   ./01_common_crates
//
// 使用 Cargo 项目：
//   cargo new my_project
//   cd my_project
//   cargo add serde --features derive
//   cargo add tokio --features full
//   cargo run
// ============================================
