// ============================================================
// Rust 知识点：时间处理与基本随机数
// 编译：rustc 003_time_and_rand.rs && .\003_time_and_rand.exe
// ============================================================

use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

fn main() {
    // ========== Instant（性能计时） ==========
    let start = Instant::now();

    // 模拟一些工作
    let mut sum = 0u64;
    for i in 0..1_000_000 {
        sum += i;
    }

    let elapsed = start.elapsed();
    println!("计算耗时: {:?}", elapsed);
    println!("耗时微秒: {} μs", elapsed.as_micros());
    println!("耗时纳秒: {} ns", elapsed.as_nanos());

    // ---- Duration（时间间隔） ----
    let five_seconds = Duration::from_secs(5);
    let hundred_ms = Duration::from_millis(100);
    let specific = Duration::new(2, 500_000_000); // 2.5 秒

    println!("\nDuration 操作:");
    println!("5秒 = {:?}", five_seconds);
    println!("100毫秒 = {:?}", hundred_ms);
    println!("2.5秒 = {:?}", specific);

    let total = five_seconds + hundred_ms;
    println!("5秒 + 100毫秒 = {:?}", total);

    // ---- 比较 Duration ----
    assert!(Duration::from_secs(2) > Duration::from_secs(1));
    assert!(Duration::from_secs(1) == Duration::from_millis(1000));

    // ========== SystemTime（系统时间） ==========
    let now = SystemTime::now();
    println!("\n系统时间: {:?}", now);

    // 自 UNIX 纪元以来的时间
    match now.duration_since(UNIX_EPOCH) {
        Ok(duration) => {
            println!("自 1970-01-01 以来已过: {:?}", duration);
            println!("天数: {}", duration.as_secs() / 86400);
        }
        Err(e) => {
            println!("时间错误: {:?}", e);
        }
    }

    // 时间运算
    let future = now + Duration::from_secs(3600); // 一小时后
    println!("一小时后: {:?}", future);

    // ---- 格式化时间（依赖外部 crate） ----
    // chrono crate 提供了更丰富的时间处理
    // let formatted = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
    // println!("格式化时间: {}", formatted);

    // ========== 基本随机数（标准库不包含） ==========
    // Rust 标准库不包含随机数生成器
    // 需要使用 rand crate
    // Cargo.toml 中添加: rand = "0.8"
    //
    // use rand::Rng;
    // let mut rng = rand::thread_rng();
    // let n: u32 = rng.gen();
    // let range = rng.gen_range(1..=100);

    println!("\n注意：标准库无随机数生成器");
    println!("需添加 rand crate 依赖");
    println!("Cargo.toml: rand = \"0.8\"");
}
