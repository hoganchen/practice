// ============================================================
// Rust 知识点：位运算符 —— 按位与或异或、移位
// 编译：rustc 003_bitwise_operators.rs && .\003_bitwise_operators.exe
// ============================================================

fn main() {
    let a: u8 = 0b1010_1010; // 170
    let b: u8 = 0b1111_0000; // 240

    // 按位与：对应位都是 1 才为 1
    let and = a & b;  // 0b1010_0000 = 160
    println!("a & b  = {:08b} = {}", and, and);

    // 按位或：对应位有一个是 1 即为 1
    let or = a | b;   // 0b1111_1010 = 250
    println!("a | b  = {:08b} = {}", or, or);

    // 按位异或：对应位不同为 1
    let xor = a ^ b;  // 0b0101_1010 = 90
    println!("a ^ b  = {:08b} = {}", xor, xor);

    // 按位非（取反）
    let not = !a;     // 0b0101_0101 = 85
    println!("!a     = {:08b} = {}", not, not);

    // 左移：高位丢弃，低位补 0
    let shl = 1u8 << 3; // 1 -> 8
    println!("1 << 3 = {}", shl);

    // 右移：低位丢弃，正数高位补 0
    let shr = 16u8 >> 2; // 16 -> 4
    println!("16 >> 2 = {}", shr);

    // 有符号数右移（算术右移）：高位补符号位
    let neg: i8 = -8;     // 二进制：1111_1000
    let shr_neg = neg >> 2;
    println!("-8 >> 2 = {} (算术右移，符号位扩展)", shr_neg);

    // 复合位运算符
    let mut flags: u8 = 0b0000_0001;
    flags |= 0b0000_0010; // 设置位
    println!("flags |= 0b0010: {:08b}", flags);
    flags &= 0b0000_0001; // 清除位
    println!("flags &= 0b0001: {:08b}", flags);

    // 位运算常见用途
    let permission_read = 0b100;
    let permission_write = 0b010;
    let permission_exec = 0b001;
    let user_perm = permission_read | permission_write; // 110
    let can_read = user_perm & permission_read != 0;
    let can_exec = user_perm & permission_exec != 0;
    println!("有读权限: {can_read}, 有执行权限: {can_exec}");
}
