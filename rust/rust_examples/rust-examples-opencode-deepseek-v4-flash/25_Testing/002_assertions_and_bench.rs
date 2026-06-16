// ============================================================
// Rust 知识点：断言宏和基础性能测试
// 编译：rustc 002_assertions_and_bench.rs && .\002_assertions_and_bench.exe
// ============================================================

fn main() {
    // ---- assert! 宏 ----
    let x = true;
    assert!(x); // 条件为 true 则通过

    // ---- assert_eq! 宏 ----
    let a = 42;
    let b = 42;
    assert_eq!(a, b); // 两个值相等则通过

    // ---- assert_ne! 宏 ----
    assert_ne!(1, 2); // 两个值不相等则通过

    // ---- 自定义错误消息 ----
    let value = 10;
    assert!(
        value > 5,
        "value 应该大于 5，实际值为 {}",
        value
    );

    // ---- debug_assert!（仅 debug 模式生效） ----
    debug_assert!(true); // release 模式下被移除
    debug_assert_eq!(1, 1);
    debug_assert_ne!(1, 2);

    // ---- unreachable! ----
    enum Level {
        Low,
        Medium,
        High,
    }

    let level = Level::Medium;
    match level {
        Level::Low => println!("低"),
        Level::Medium => println!("中"),
        Level::High => println!("高"),
        // _ => unreachable!(), // 如果所有分支都已覆盖
    }

    // ---- unimplemented! ----
    fn _feature_todo() {
        // unimplemented!("此功能尚未实现");
    }

    // ---- todo! ----
    fn _planned_feature() {
        // todo!("将在下一版本实现");
    }

    // ---- panic! ----
    fn assert_positive(n: i32) {
        if n < 0 {
            panic!("断言失败：{} 不是正数", n);
        }
    }

    assert_positive(5);
    // assert_positive(-3); // 取消注释会 panic

    println!("\n所有断言通过！");

    // ---- 基础性能计时 ----
    use std::time::Instant;

    let start = Instant::now();

    let mut sum = 0u64;
    for i in 0..1_000_000 {
        sum += i;
    }

    let duration = start.elapsed();
    println!("计算耗时: {:?}", duration);
    println!("计算结果: {}", sum);
}
