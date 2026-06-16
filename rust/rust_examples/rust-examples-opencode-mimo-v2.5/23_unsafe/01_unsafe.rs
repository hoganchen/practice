// ============================================
// 知识点：Unsafe Rust
// 难度：高级
// ============================================

// Unsafe Rust 允许执行一些安全 Rust 禁止的操作
// 包括：解引用裸指针、调用 unsafe 函数、访问可变静态变量、实现 unsafe trait

fn main() {
    // ==================== 解引用裸指针 ====================
    println!("=== 解引用裸指针 ===");
    
    let mut num = 5;
    
    // 创建裸指针（安全操作）
    let r1 = &num as *const i32;
    let r2 = &mut num as *mut i32;
    
    println!("r1 指向的值: {}", unsafe { *r1 });
    
    unsafe {
        *r2 = 10;
        println!("r2 修改后: {}", *r2);
    }
    
    // ==================== 调用 unsafe 函数 ====================
    println!("\n=== 调用 unsafe 函数 ===");
    
    unsafe fn dangerous() {
        println!("这是一个 unsafe 函数");
    }
    
    unsafe {
        dangerous();
    }
    
    // ==================== 创建安全抽象 ====================
    println!("\n=== 创建安全抽象 ===");
    
    fn split_at_mut(slice: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
        let len = slice.len();
        let ptr = slice.as_mut_ptr();
        
        assert!(mid <= len);
        
        unsafe {
            (
                std::slice::from_raw_parts_mut(ptr, mid),
                std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
            )
        }
    }
    
    let mut v = vec![1, 2, 3, 4, 5, 6];
    let (left, right) = split_at_mut(&mut v, 3);
    
    println!("左边: {:?}", left);
    println!("右边: {:?}", right);
    
    left[0] = 10;
    right[0] = 20;
    
    println!("修改后左边: {:?}", left);
    println!("修改后右边: {:?}", right);
    
    // ==================== 访问可变静态变量 ====================
    println!("\n=== 访问可变静态变量 ===");
    
    static mut COUNTER: u32 = 0;
    
    fn add_to_counter(inc: u32) {
        unsafe {
            COUNTER += inc;
        }
    }
    
    add_to_counter(3);
    add_to_counter(5);
    
    unsafe {
        println!("COUNTER: {}", COUNTER);
    }
    
    // ==================== 实现 unsafe trait ====================
    println!("\n=== 实现 unsafe trait ===");
    
    unsafe trait Foo {
        fn foo(&self);
    }
    
    struct MyStruct;
    
    unsafe impl Foo for MyStruct {
        fn foo(&self) {
            println!("Foo 实现");
        }
    }
    
    let my_struct = MyStruct;
    unsafe {
        my_struct.foo();
    }
    
    // ==================== 裸指针运算 ====================
    println!("\n=== 裸指针运算 ===");
    
    let arr = [10, 20, 30, 40, 50];
    let ptr = arr.as_ptr();
    
    unsafe {
        for i in 0..arr.len() {
            println!("arr[{}] = {}", i, *ptr.add(i));
        }
    }
    
    // 指针算术
    let mut data = [1, 2, 3, 4, 5];
    let ptr = data.as_mut_ptr();
    
    unsafe {
        // 将每个元素翻倍
        for i in 0..data.len() {
            *ptr.add(i) *= 2;
        }
    }
    
    println!("翻倍后: {:?}", data);
    
    // ==================== 内存布局 ====================
    println!("\n=== 内存布局 ===");
    
    #[repr(C)]
    struct CStruct {
        x: i32,
        y: i32,
        z: i32,
    }
    
    let c_struct = CStruct { x: 1, y: 2, z: 3 };
    
    println!("CStruct 大小: {} 字节", std::mem::size_of::<CStruct>());
    println!("CStruct 对齐: {} 字节", std::mem::align_of::<CStruct>());
    
    // 获取字段偏移
    let x_offset = unsafe {
        let base = &c_struct as *const CStruct as usize;
        let x = &c_struct.x as *const i32 as usize;
        x - base
    };
    
    println!("x 偏移: {} 字节", x_offset);
    
    // ==================== transmute ====================
    println!("\n=== transmute ===");
    
    // transmute 可以在不同类型之间转换
    // 这非常危险，应该尽量避免
    
    let x: f32 = 3.14;
    let y: i32 = unsafe { std::mem::transmute(x) };
    
    println!("f32 {} 转换为 i32 {}", x, y);
    
    // 更安全的替代方案
    let x: f32 = 3.14;
    let y = x.to_bits();
    println!("f32 {} 的位表示: {}", x, y);
    
    // ==================== union ====================
    println!("\n=== union ===");
    
    #[repr(C)]
    union IntOrFloat {
        i: i32,
        f: f32,
    }
    
    let value = IntOrFloat { i: 42 };
    
    unsafe {
        println!("作为整数: {}", value.i);
    }
    
    let value = IntOrFloat { f: 3.14 };
    
    unsafe {
        println!("作为浮点数: {}", value.f);
    }
    
    // ==================== FFI（外部函数接口） ====================
    println!("\n=== FFI 概念 ===");
    
    // 声明外部函数（C 库函数）
    extern "C" {
        fn abs(input: i32) -> i32;
    }
    
    let x = -42;
    let result = unsafe { abs(x) };
    println!("abs({}) = {}", x, result);
    
    // ==================== 安全封装 ====================
    println!("\n=== 安全封装 ===");
    
    struct SafeWrapper {
        data: Vec<i32>,
    }
    
    impl SafeWrapper {
        fn new() -> Self {
            SafeWrapper { data: Vec::new() }
        }
        
        fn push(&mut self, value: i32) {
            self.data.push(value);
        }
        
        // 安全的接口
        fn get(&self, index: usize) -> Option<&i32> {
            self.data.get(index)
        }
    }
    
    impl Drop for SafeWrapper {
        fn drop(&mut self) {
            println!("SafeWrapper 被释放");
        }
    }
    
    let mut wrapper = SafeWrapper::new();
    wrapper.push(1);
    wrapper.push(2);
    wrapper.push(3);
    
    println!("值: {:?}", wrapper.get(0));
    println!("值: {:?}", wrapper.get(10));
    
    // ==================== 内存安全考虑 ====================
    println!("\n=== 内存安全考虑 ===");
    
    // 使用 Box 进行堆分配
    let boxed = Box::new(42);
    println!("Box 值: {}", boxed);
    
    // 使用 ManuallyDrop 控制析构
    let mut manual = std::mem::ManuallyDrop::new(Box::new(100));
    println!("ManuallyDrop 值: {}", manual);
    
    // 手动丢弃（不推荐）
    unsafe {
        let _dropped = std::ptr::read(&*manual);
        // manual 现在不应该再使用
    }
    
    // ==================== 实际应用示例 ====================
    println!("\n=== 实际应用 ===");
    
    // 高性能数组处理
    fn process_array(data: &mut [f64]) {
        // 使用 unsafe 进行批量处理
        let ptr = data.as_mut_ptr();
        let len = data.len();
        
        unsafe {
            for i in 0..len {
                *ptr.add(i) = (*ptr.add(i)).sqrt();
            }
        }
    }
    
    let mut data = vec![4.0, 9.0, 16.0, 25.0];
    process_array(&mut data);
    println!("处理后: {:?}", data);
    
    println!("\nUnsafe Rust 演示完成!");
    println!("警告：unsafe 代码需要格外小心，确保内存安全");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_unsafe.rs -o 01_unsafe.exe
//   01_unsafe.exe
//
// Linux/macOS:
//   rustc 01_unsafe.rs -o 01_unsafe
//   ./01_unsafe
// ============================================
