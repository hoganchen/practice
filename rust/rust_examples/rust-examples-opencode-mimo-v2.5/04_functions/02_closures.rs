// ============================================
// 知识点：闭包
// 难度：中级
// ============================================

// 闭包是可以捕获其环境中变量的匿名函数
// 闭包使用 | | 语法定义参数
// 闭包可以自动推断参数和返回值类型

fn main() {
    // ==================== 基础闭包 ====================
    // 闭包语法：|参数| 表达式
    let add = |a, b| a + b;
    let result = add(5, 3);
    println!("5 + 3 = {}", result);
    
    // 单参数闭包
    let square = |x| x * x;
    println!("7² = {}", square(7));
    
    // 无参数闭包
    let say_hello = || println!("Hello!");
    say_hello();
    
    // 带类型标注的闭包
    let add_typed = |a: i32, b: i32| -> i32 { a + b };
    println!("带类型标注: {}", add_typed(10, 20));
    
    // ==================== 闭包捕获环境 ====================
    // 闭包可以捕获其定义环境中的变量
    
    let offset = 10;
    let add_offset = |x| x + offset;  // 捕获 offset
    println!("5 + 10 = {}", add_offset(5));
    
    // 闭包捕获可变变量
    let mut count = 0;
    let mut increment = || {
        count += 1;
        count
    };
    
    println!("计数: {}", increment());
    println!("计数: {}", increment());
    println!("计数: {}", increment());
    
    // ==================== 闭包作为参数 ====================
    // 闭包可以作为函数参数传递
    
    fn apply_to_5(f: impl Fn(i32) -> i32) -> i32 {
        f(5)
    }
    
    let double = |x| x * 2;
    let add_ten = |x| x + 10;
    
    println!("5 × 2 = {}", apply_to_5(double));
    println!("5 + 10 = {}", apply_to_5(add_ten));
    
    // ==================== Fn, FnMut, FnOnce ====================
    // Rust 有三种闭包 trait：
    // 1. Fn：不可变借用捕获的变量
    // 2. FnMut：可变借用捕获的变量
    // 3. FnOnce：获取捕获变量的所有权
    
    // Fn 闭包（不可变借用）
    let name = String::from("Alice");
    let greet = || println!("Hello, {}!", name);  // 借用 name
    greet();
    greet();  // 可以多次调用
    println!("name 仍然可用: {}", name);
    
    // FnMut 闭包（可变借用）
    let mut numbers = vec![1, 2, 3];
    let mut push_number = || numbers.push(4);  // 可变借用 numbers
    push_number();
    println!("Numbers: {:?}", numbers);
    
    // FnOnce 闭包（获取所有权）
    let name = String::from("Bob");
    let consume = || {
        let _name = name;  // 获取 name 的所有权
        println!("Consumed: {}", _name);
    };
    consume();
    // consume();  // 错误：不能多次调用 FnOnce 闭包
    // println!("{}", name);  // 错误：name 已被移动
    
    // ==================== 闭包作为返回值 ====================
    // 闭包可以作为函数返回值
    
    fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
        move |y| x + y  // 使用 move 转移所有权
    }
    
    let add5 = make_adder(5);
    let add10 = make_adder(10);
    
    println!("5 + 3 = {}", add5(3));
    println!("10 + 3 = {}", add10(3));
    
    // ==================== 闭包与迭代器 ====================
    // 闭包在迭代器中非常常用
    
    let numbers = vec![1, 2, 3, 4, 5];
    
    // map：转换每个元素
    let doubled: Vec<i32> = numbers.iter().map(|&x| x * 2).collect();
    println!("翻倍: {:?}", doubled);
    
    // filter：过滤元素
    let evens: Vec<&i32> = numbers.iter().filter(|&&x| x % 2 == 0).collect();
    println!("偶数: {:?}", evens);
    
    // fold：累加
    let sum = numbers.iter().fold(0, |acc, &x| acc + x);
    println!("总和: {}", sum);
    
    // ==================== 闭包性能 ====================
    // 闭包是零成本抽象，编译器会内联闭包
    
    let add = |a: i32, b: i32| a + b;
    let result = add(1, 2);
    println!("闭包性能测试: {}", result);
    
    // ==================== 高级闭包用法 ====================
    
    // 闭包作为数据结构
    struct Calculator {
        operation: Box<dyn Fn(i32) -> i32>,
    }
    
    impl Calculator {
        fn new(operation: Box<dyn Fn(i32) -> i32>) -> Self {
            Calculator { operation }
        }
        
        fn calculate(&self, value: i32) -> i32 {
            (self.operation)(value)
        }
    }
    
    let square_calc = Calculator::new(Box::new(|x| x * x));
    let double_calc = Calculator::new(Box::new(|x| x * 2));
    
    println!("平方计算: {}", square_calc.calculate(5));
    println!("翻倍计算: {}", double_calc.calculate(5));
    
    // 闭包组合
    fn compose(f: impl Fn(i32) -> i32, g: impl Fn(i32) -> i32) -> impl Fn(i32) -> i32 {
        move |x| f(g(x))
    }
    
    let add_one = |x| x + 1;
    let double = |x| x * 2;
    let add_one_then_double = compose(double, add_one);
    
    println!("(5 + 1) × 2 = {}", add_one_then_double(5));
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 02_closures.rs -o 02_closures.exe
//   02_closures.exe
//
// Linux/macOS:
//   rustc 02_closures.rs -o 02_closures
//   ./02_closures
// ============================================
