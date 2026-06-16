// ============================================================
// Rust 知识点：Tokio 运行时 —— 最流行的异步运行时
// 使用方式：添加 tokio 依赖（Cargo.toml 中添加 tokio feature）
// Cargo.toml 需添加：
//   [dependencies]
//   tokio = { version = "1", features = ["full"] }
//
// 编译：cargo run
// 注意：本文件需要用 cargo 项目运行，不能直接用 rustc
// ============================================================

// #[tokio::main] 宏将 async fn main 转为同步入口
// #[tokio::main]
// async fn main() {
//     println!("Tokio 运行时启动");
//
//     // ---- 并发执行多个任务 ----
//     let handle1 = tokio::spawn(async {
//         "任务 1 的结果"
//     });
//
//     let handle2 = tokio::spawn(async {
//         "任务 2 的结果"
//     });
//
//     let result1 = handle1.await.unwrap();
//     let result2 = handle2.await.unwrap();
//
//     println!("{} 和 {}", result1, result2);
//
//     // ---- 异步 IO ----
//     // tokio::fs::read_to_string("Cargo.toml").await;
//
//     // ---- 超时 ----
//     use tokio::time::{sleep, timeout, Duration};
//
//     let result = timeout(Duration::from_secs(1), async {
//         sleep(Duration::from_millis(500)).await;
//         "完成"
//     }).await;
//
//     match result {
//         Ok(msg) => println!("超时前完成: {}", msg),
//         Err(_) => println!("超时!"),
//     }
//
//     // ---- select! 宏 ----
//     tokio::pin! {
//         let slow = sleep(Duration::from_secs(2));
//         let fast = sleep(Duration::from_secs(1));
//     }
//
//     tokio::select! {
//         _ = slow => println!("慢任务完成"),
//         _ = fast => println!("快任务完成（先完成）"),
//     }
// }

fn main() {
    println!("本示例需要 Tokio 运行时。");
    println!("请在 Cargo 项目中添加 tokio 依赖后运行。");
    println!("");
    println!("使用方法：");
    println!("1. 创建项目目录和 Cargo.toml");
    println!("2. Cargo.toml 中添加:");
    println!("   [dependencies]");
    println!("   tokio = { version = \"1\", features = [\"full\"] }");
    println!("3. 将本文件内容放入 src/main.rs");
    println!("4. cargo run");
}
