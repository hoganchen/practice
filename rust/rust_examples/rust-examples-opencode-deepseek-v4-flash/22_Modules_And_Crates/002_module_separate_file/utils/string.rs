// ============================================================
// utils/string.rs —— utils 模块的子模块
// ============================================================

pub fn capitalize(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        None => String::new(),
        Some(first) => first.to_uppercase().to_string() + chars.as_str(),
    }
}

pub fn reverse(s: &str) -> String {
    s.chars().rev().collect()
}

pub fn count_words(s: &str) -> usize {
    s.split_whitespace().count()
}
