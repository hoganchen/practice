// ============================================================
// Rust 知识点：Newtype 模式、Never 类型、Sized/Unsized
// 编译：rustc 001_newtype_and_never.rs && .\001_newtype_and_never.exe
// ============================================================

// ========== Newtype 模式 ==========
// 用元组结构体包裹已有类型，创建新类型
// 优势：编译期类型安全、可自定义 trait 实现

// 示例：不同类型的安全包装
struct Meters(u64);  // 米
struct Kilometers(u64); // 公里

impl Meters {
    fn to_km(&self) -> Kilometers {
        Kilometers(self.0 / 1000)
    }
}

// Newtype 实现外部 trait
struct Wrapper(Vec<String>);

impl std::fmt::Display for Wrapper {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

// ========== Never 类型 ! ==========
// ! 类型表示永远不会返回的值
// 在 Rust 中是一个类型，可以强制转换为任何其他类型

fn never_returns() -> ! {
    panic!("这个函数永远不返回");
}

// fn example_never() -> i32 {
//     // never_returns() 是 ! 类型，可以强制转为 i32
//     let x = never_returns();
//     x
// }

// ========== Sized 和 ?Sized ==========
// 默认所有泛型类型都是 Sized（编译时大小已知）
// ?Sized 表示可以是 Sized 或 unsized（动态大小类型）

// Sized 约束
fn sized_function<T: Sized>(_val: T) {
    // T 必须有已知的大小
}

// ?Sized 约束
fn unsized_function<T: ?Sized>(_val: &T) {
    // T 可以是动态大小类型（如 str, [T]）
}

// ========== 动态大小类型（DST） ==========
// str 和 [T] 是动态大小类型，必须通过引用使用
// &str 和 &[T] 是胖指针（ptr + len）

fn main() {
    // ---- Newtype 使用 ----
    let dist_m = Meters(3500);
    let dist_km = dist_m.to_km();
    println!("{} 米 = {} 公里", dist_m.0, dist_km.0);

    // 类型安全：不会混淆不同类型
    // fn need_meters(m: Meters) {}
    // fn need_kilometers(km: Kilometers) {}
    // need_meters(dist_km); // 编译错误！类型不匹配

    // ---- Wrapper 实现外部 trait ----
    let w = Wrapper(vec!["hello".to_string(), "world".to_string()]);
    println!("Wrapper Display: {}", w);

    // ---- Never 类型 ----
    // let _a: ! = never_returns(); // 这行永远不会执行

    // ---- match 中的 never ----
    let number = Some(42);
    let result = match number {
        Some(n) => n,
        None => never_returns(), // ! 类型强制转换为 i32
    };
    println!("result: {}", result);

    // ---- DST 演示 ----
    let s: &str = "hello"; // &str 是胖指针（2 个 usize）
    let arr: &[i32] = &[1, 2, 3]; // &[i32] 也是胖指针
    println!("s: {}, arr: {:?}", s, arr);

    // ---- 编译时 vs 动态大小 ----
    println!("i32 大小: {} 字节", std::mem::size_of::<i32>());
    println!("&str 大小: {} 字节", std::mem::size_of::<&str>());
    println!("Box<[i32]> 大小: {} 字节", std::mem::size_of::<Box<[i32]>>());
}
