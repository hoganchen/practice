// ============================================================
// Rust 知识点：std::mem 模块 —— 内存操作工具
// 编译：rustc 004_mem_module.rs && .\004_mem_module.exe
// ============================================================

use std::mem;

// ---- 实现自定义 Debug（演示内存操作） ----
#[derive(Debug)]
struct Person {
    name: String,
    age: u8,
}

fn main() {
    // ========== 大小和对齐 ==========
    println!("=== 大小和对齐 ===");
    println!("u8 大小: {} 对齐: {}", mem::size_of::<u8>(), mem::align_of::<u8>());
    println!("i32 大小: {} 对齐: {}", mem::size_of::<i32>(), mem::align_of::<i32>());
    println!("f64 大小: {} 对齐: {}", mem::size_of::<f64>(), mem::align_of::<f64>());
    println!("String 大小: {}", mem::size_of::<String>());
    println!("Vec<i32> 大小: {}", mem::size_of::<Vec<i32>>());
    println!("Person 大小: {} 对齐: {}",
        mem::size_of::<Person>(),
        mem::align_of::<Person>());

    // ---- size_of_val（运行时实际值大小） ----
    let s = String::from("hello");
    println!("String 值大小: {} 字节（堆上字符串长度: {}）",
        mem::size_of_val(&s), s.len());

    let arr: [u8; 100] = [0; 100];
    println!("[u8; 100] 值大小: {}", mem::size_of_val(&arr));

    // ========== swap 与 replace ==========
    println!("\n=== swap 与 replace ===");
    let mut a = String::from("AAA");
    let mut b = String::from("BBB");

    mem::swap(&mut a, &mut b);
    println!("swap 后: a={}, b={}", a, b);

    // replace：替换并返回旧值
    let old = mem::replace(&mut a, String::from("CCC"));
    println!("replace: a={}, 旧值={}", a, old);

    // ========== take —— 替换为默认值 ==========
    println!("\n=== take ===");
    let mut name = String::from("Alice");
    let taken = mem::take(&mut name); // 等价于 replace(&mut name, String::new())
    println!("take: name='{}', 取出的='{}'", name, taken);

    // 对 Option 使用 take：取出值并设为 None
    let mut x: Option<i32> = Some(42);
    let y = x.take();
    println!("Option take: x={:?}, y={:?}", x, y);

    // ========== drop —— 提前析构 ==========
    println!("\n=== drop ===");
    let val = Person {
        name: String::from("Bob"),
        age: 25,
    };
    println!("在 drop 之前");
    mem::drop(val);
    // println!("{}", val.name); // 编译错误！已被 drop
    println!("drop 之后不再可用");

    // ========== ManuallyDrop —— 阻止自动析构 ==========
    println!("\n=== ManuallyDrop ===");
    use mem::ManuallyDrop;

    let md = ManuallyDrop::new(String::from("手动管理"));
    // ManuallyDrop 不会自动释放 String 的堆内存
    // 需要时手动取回
    let _inner = ManuallyDrop::into_inner(md); // 触发 drop

    // ========== MaybeUninit —— 未初始化内存 ==========
    println!("\n=== MaybeUninit ===");
    use mem::MaybeUninit;

    // 创建未初始化的数组（避免零初始化开销）
    let mut uninit_array: MaybeUninit<[u8; 1024]> = MaybeUninit::uninit();

    // 安全地初始化
    let initialized = unsafe {
        let arr = uninit_array.as_mut_ptr();
        for i in 0..1024 {
            (*arr)[i] = (i % 256) as u8;
        }
        uninit_array.assume_init()
    };
    println!("MaybeUninit 数组前5个: {:?}", &initialized[..5]);

    // ========== discriminant —— 判别式值 ==========
    println!("\n=== discriminant ===");
    enum E {
        Foo = 1,
        Bar = 2,
        Baz = 3,
    }
    println!("E::Foo 判别式: {:?}", mem::discriminant(&E::Foo));

    // ========== 零大小类型 ==========
    println!("\n=== ZST（零大小类型） ===");
    println!("() 大小: {}", mem::size_of::<()>());
    println!("PhantomData<i32> 大小: {}", mem::size_of::<std::marker::PhantomData<i32>>());

    // ---- 关于零大小类型的重要特性 ----
    // ZST 不占用内存，但可以参与类型系统
    let unit_array: [(); 100] = [(); 100];
    println!("[(); 100] 大小: {}", mem::size_of_val(&unit_array)); // 0!
}
