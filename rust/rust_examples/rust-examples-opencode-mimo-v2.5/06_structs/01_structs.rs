// ============================================
// 知识点：结构体
// 难度：中级
// ============================================

// 结构体是自定义数据类型
// 使用 struct 关键字定义
// 结构体可以包含不同类型的数据

fn main() {
    // ==================== 基础结构体 ====================
    // 定义结构体
    struct User {
        username: String,
        email: String,
        active: bool,
        sign_in_count: u64,
    }
    
    // 创建结构体实例
    let user1 = User {
        username: String::from("alice"),
        email: String::from("alice@example.com"),
        active: true,
        sign_in_count: 1,
    };
    
    // 访问字段
    println!("用户名: {}", user1.username);
    println!("邮箱: {}", user1.email);
    println!("活跃: {}", user1.active);
    println!("登录次数: {}", user1.sign_in_count);
    
    // 修改结构体字段（需要 mut）
    let mut user2 = User {
        username: String::from("bob"),
        email: String::from("bob@example.com"),
        active: true,
        sign_in_count: 1,
    };
    user2.email = String::from("bob_new@example.com");
    println!("新邮箱: {}", user2.email);
    
    // ==================== 字段初始化简写 ====================
    // 当变量名与字段名相同时，可以使用简写
    
    let username = String::from("charlie");
    let email = String::from("charlie@example.com");
    
    let user3 = User {
        username,  // 简写
        email,    // 简写
        active: true,
        sign_in_count: 1,
    };
    println!("用户: {}", user3.username);
    
    // ==================== 结构体更新语法 ====================
    // 使用 ..other 来复制其他字段
    
    let user4 = User {
        username: String::from("dave"),
        ..user3  // 复制 user3 的其他字段
    };
    println!("用户4: {}", user4.username);
    println!("用户4 邮箱: {}", user4.email);
    
    // ==================== 元组结构体 ====================
    // 元组结构体没有字段名，只有类型
    
    struct Color(u8, u8, u8);
    struct Point(f64, f64, f64);
    
    let black = Color(0, 0, 0);
    let origin = Point(0.0, 0.0, 0.0);
    
    println!("黑色: ({}, {}, {})", black.0, black.1, black.2);
    println!("原点: ({}, {}, {})", origin.0, origin.1, origin.2);
    
    // ==================== 单元结构体 ====================
    // 没有任何字段的结构体
    
    struct AlwaysEqual;
    
    let _always_equal = AlwaysEqual;
    
    // ==================== 方法 ====================
    // 使用 impl 块为结构体定义方法
    
    struct Rectangle {
        width: f64,
        height: f64,
    }
    
    impl Rectangle {
        // 方法（&self）
        fn area(&self) -> f64 {
            self.width * self.height
        }
        
        fn perimeter(&self) -> f64 {
            2.0 * (self.width + self.height)
        }
        
        // 可变方法（&mut self）
        fn scale(&mut self, factor: f64) {
            self.width *= factor;
            self.height *= factor;
        }
        
        // 关联函数（没有 self）
        // 通常用作构造函数
        fn new(width: f64, height: f64) -> Self {
            Rectangle { width, height }
        }
        
        fn square(size: f64) -> Self {
            Rectangle {
                width: size,
                height: size,
            }
        }
        
        // 判断是否包含另一个矩形
        fn can_hold(&self, other: &Rectangle) -> bool {
            self.width >= other.width && self.height >= other.height
        }
    }
    
    // 创建矩形
    let mut rect1 = Rectangle::new(10.0, 5.0);
    let rect2 = Rectangle::square(3.0);
    
    println!("面积: {}", rect1.area());
    println!("周长: {}", rect1.perimeter());
    
    // 调用可变方法
    rect1.scale(2.0);
    println!("缩放后面积: {}", rect1.area());
    
    // 判断是否包含
    println!("rect1 包含 rect2: {}", rect1.can_hold(&rect2));
    
    // ==================== 多个 impl 块 ====================
    // 可以有多个 impl 块
    
    impl Rectangle {
        fn is_square(&self) -> bool {
            self.width == self.height
        }
    }
    
    println!("是否为正方形: {}", rect2.is_square());
    
    // ==================== 结构体与所有权 ====================
    struct Person {
        name: String,
        age: u32,
    }
    
    impl Person {
        fn new(name: &str, age: u32) -> Self {
            Person {
                name: String::from(name),
                age,
            }
        }
        
        // 返回引用
        fn name(&self) -> &str {
            &self.name
        }
        
        // 获取所有权
        fn into_name(self) -> String {
            self.name
        }
    }
    
    let person = Person::new("Alice", 30);
    println!("姓名: {}", person.name());
    
    // into_name 获取所有权
    let name = person.into_name();
    println!("获取的名字: {}", name);
    // println!("{}", person.name());  // 错误：person 已被移动
    
    // ==================== 结构体与泛型 ====================
    struct Point<T> {
        x: T,
        y: T,
    }
    
    impl<T> Point<T> {
        fn new(x: T, y: T) -> Self {
            Point { x, y }
        }
    }
    
    let integer_point = Point::new(5, 10);
    let float_point = Point::new(1.0, 4.0);
    
    println!("整数点: ({}, {})", integer_point.x, integer_point.y);
    println!("浮点点: ({}, {})", float_point.x, float_point.y);
    
    // ==================== 结构体与 trait ====================
    trait Drawable {
        fn draw(&self);
    }
    
    struct Circle {
        radius: f64,
    }
    
    impl Drawable for Circle {
        fn draw(&self) {
            println!("绘制圆形，半径: {}", self.radius);
        }
    }
    
    let circle = Circle { radius: 5.0 };
    circle.draw();
    
    // ==================== 结构体调试输出 ====================
    // 使用 #[derive(Debug)] 自动实现 Debug trait
    
    #[derive(Debug)]
    struct DebugStruct {
        x: i32,
        y: String,
    }
    
    let debug_struct = DebugStruct {
        x: 42,
        y: String::from("hello"),
    };
    
    // 使用 {:?} 或 {:#?} 格式化
    println!("调试输出: {:?}", debug_struct);
    println!("格式化输出: {:#?}", debug_struct);
    
    // 使用 dbg! 宏
    dbg!(&debug_struct);
    
    // ==================== 结构体与模式匹配 ====================
    #[derive(Debug)]
    enum Shape {
        Circle(f64),
        Rectangle(f64, f64),
        Triangle(f64, f64, f64),
    }
    
    let shapes = vec![
        Shape::Circle(5.0),
        Shape::Rectangle(10.0, 5.0),
        Shape::Triangle(3.0, 4.0, 5.0),
    ];
    
    for shape in &shapes {
        match shape {
            Shape::Circle(radius) => println!("圆形，半径: {}", radius),
            Shape::Rectangle(width, height) => {
                println!("矩形，宽度: {}，高度: {}", width, height)
            }
            Shape::Triangle(a, b, c) => {
                println!("三角形，边长: {}, {}, {}", a, b, c)
            }
        }
    }
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_structs.rs -o 01_structs.exe
//   01_structs.exe
//
// Linux/macOS:
//   rustc 01_structs.rs -o 01_structs
//   ./01_structs
// ============================================
