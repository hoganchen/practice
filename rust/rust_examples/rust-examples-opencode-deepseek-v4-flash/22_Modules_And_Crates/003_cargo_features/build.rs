// ============================================================
// Rust 知识点：build.rs —— Cargo 构建脚本
// 在编译前执行，可生成代码、链接库、配置编译
// ============================================================

fn main() {
    // ---- 链接系统库 ----
    // println!("cargo:rustc-link-lib=ssl");

    // ---- 传递编译配置 ----
    // 这些可以通过 env!("KEY") 在 main.rs 中获取
    println!("cargo:rustc-env=BUILD_TIMESTAMP={}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs());

    // ---- 条件编译标志 ----
    // 根据环境变量设置特性
    // if std::env::var("CARGO_FEATURE_EXTRA").is_ok() {
    //     println!("cargo:rustc-cfg=feature=\"dynamic_extra\"");
    // }

    // ---- 重运行条件 ----
    // 当某些文件变化时重新运行 build.rs
    println!("cargo:rerun-if-changed=src/");
    println!("cargo:rerun-if-env-changed=CUSTOM_BUILD_FLAG");

    println!("cargo:warning=构建脚本执行完成");
}
