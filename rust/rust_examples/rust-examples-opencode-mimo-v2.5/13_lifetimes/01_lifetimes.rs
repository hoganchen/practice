// ============================================
// 知识点：生命周期
// 难度：高级
// ============================================

// 生命周期确保引用在其被使用期间有效
// 编译器使用生命周期标注来验证引用的有效性

fn main() {
    // ==================== 基础生命周期 ====================
    // 每个引用都有生命周期
    // 编译器可以自动推断大部分生命周期
    
    let x = 5;
    let r = &x;  // r 的生命周期从这里开始
    println!("{}", r);  // r 的生命周期在这里结束
    
    // ==================== 函数中的生命周期 ====================
    // 当函数返回引用时，需要生命周期标注
    
    fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
        if x.len() > y.len() {
            x
        } else {
            y
        }
    }
    
    let string1 = String::from("长字符串");
    let result;
    
    {
        let string2 = String::from("短");
        result = longest(string1.as_str(), string2.as_str());
        println!("更长的字符串: {}", result);
    }
    // string2 在这里已经不存在，但 result 仍然有效
    
    // ==================== 结构体中的生命周期 ====================
    // 当结构体包含引用时，需要生命周期标注
    
    struct ImportantExcerpt<'a> {
        part: &'a str,
    }
    
    impl<'a> ImportantExcerpt<'a> {
        fn level(&self) -> i32 {
            3
        }
        
        fn announce_and_return_part(&self, announcement: &str) -> &str {
            println!("请注意: {}", announcement);
            self.part
        }
    }
    
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence;
    
    {
        let i = novel.as_str().find('.').unwrap_or(novel.len());
        first_sentence = &novel[..i];
    }
    
    let excerpt = ImportantExcerpt {
        part: first_sentence,
    };
    
    println!("摘录: {}", excerpt.part);
    println!("级别: {}", excerpt.level());
    
    // ==================== 方法中的生命周期 ====================
    impl<'a> ImportantExcerpt<'a> {
        fn part(&self) -> &str {
            self.part
        }
    }
    
    println!("方法返回: {}", excerpt.part());
    
    // ==================== 省略生命周期标注 ====================
    // 编译器可以自动推断生命周期的情况：
    
    // 1. 每个引用参数都获得自己的生命周期
    fn first_word(s: &str) -> &str {
        let bytes = s.as_bytes();
        
        for (i, &item) in bytes.iter().enumerate() {
            if item == b' ' {
                return &s[0..i];
            }
        }
        
        &s[..]
    }
    
    let sentence = String::from("hello world");
    let word = first_word(&sentence);
    println!("第一个单词: {}", word);
    
    // 2. 如果只有一个输入生命周期参数，它被赋给所有输出生命周期参数
    fn first_char(s: &str) -> Option<char> {
        s.chars().next()
    }
    
    if let Some(c) = first_char("hello") {
        println!("第一个字符: {}", c);
    }
    
    // ==================== 静态生命周期 ====================
    // 'static 生命周期表示整个程序执行期间
    
    let s: &'static str = "我存在整个程序执行期间";
    println!("{}", s);
    
    // 字符串字面量都是 'static 的
    let literal: &'static str = "这是字面量";
    println!("{}", literal);
    
    // ==================== 生命周期与泛型 ====================
    fn longest_with_announcement<'a, T: std::fmt::Display>(
        x: &'a str,
        y: &'a str,
        ann: T,
    ) -> &'a str {
        println!("公告: {}", ann);
        if x.len() > y.len() {
            x
        } else {
            y
        }
    }
    
    let s1 = String::from("长字符串");
    let s2 = String::from("短");
    let result = longest_with_announcement(
        s1.as_str(),
        s2.as_str(),
        "比较两个字符串",
    );
    println!("更长的字符串: {}", result);
    
    // ==================== 生命周期省略规则 ====================
    // 编译器应用三条规则来推断生命周期：
    
    // 规则 1：每个引用参数获得自己的生命周期参数
    fn rule1<'a>(s: &'a str) -> &'a str {
        s
    }
    
    // 规则 2：如果只有一个输入生命周期参数，它被赋给所有输出生命周期参数
    fn rule2(s: &str) -> &str {
        s
    }
    
    // 规则 3：如果有 &self 或 &mut self，self 的生命周期被赋给所有输出生命周期参数
    struct Parser;
    
    impl Parser {
        fn parse(&self, input: &str) -> &str {
            input
        }
    }
    
    let parser = Parser;
    let result = parser.parse("hello");
    println!("解析结果: {}", result);
    
    // ==================== 生命周期与闭包 ====================
    fn create_greeting<'a>(name: &'a str) -> impl Fn() -> String + 'a {
        move || format!("Hello, {}!", name)
    }
    
    let name = String::from("Alice");
    let greeting = create_greeting(&name);
    println!("{}", greeting());
    
    // ==================== 生命周期与迭代器 ====================
    fn filter_positive<'a>(numbers: &'a [i32]) -> Vec<&'a i32> {
        numbers.iter().filter(|&&x| x > 0).collect()
    }
    
    let numbers = vec![-1, 2, -3, 4, -5];
    let positives = filter_positive(&numbers);
    println!("正数: {:?}", positives);
    
    // ==================== 生命周期与错误处理 ====================
    fn find_word<'a>(haystack: &'a str, needle: &str) -> Option<&'a str> {
        haystack.find(needle).map(|start| &haystack[start..start + needle.len()])
    }
    
    let text = String::from("hello world");
    if let Some(word) = find_word(&text, "world") {
        println!("找到: {}", word);
    }
    
    // ==================== 生命周期与结构体 ====================
    #[derive(Debug)]
    struct TextBuffer<'a> {
        content: &'a str,
        cursor: usize,
    }
    
    impl<'a> TextBuffer<'a> {
        fn new(content: &'a str) -> Self {
            TextBuffer { content, cursor: 0 }
        }
        
        fn current_line(&self) -> &'a str {
            self.content
                .lines()
                .nth(self.cursor)
                .unwrap_or("")
        }
        
        fn move_cursor(&mut self) {
            self.cursor += 1;
        }
    }
    
    let text = String::from("第一行\n第二行\n第三行");
    let mut buffer = TextBuffer::new(&text);
    
    println!("当前行: {}", buffer.current_line());
    buffer.move_cursor();
    println!("移动后: {}", buffer.current_line());
    
    // ==================== 生命周期与泛型结构体 ====================
    struct Wrapper<'a, T: 'a> {
        data: &'a T,
        metadata: String,
    }
    
    impl<'a, T: std::fmt::Debug> Wrapper<'a, T> {
        fn new(data: &'a T, metadata: &str) -> Self {
            Wrapper {
                data,
                metadata: String::from(metadata),
            }
        }
        
        fn display(&self) {
            println!("{}: {:?}", self.metadata, self.data);
        }
    }
    
    let value = 42;
    let wrapper = Wrapper::new(&value, "数字");
    wrapper.display();
    
    println!("\n生命周期演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_lifetimes.rs -o 01_lifetimes.exe
//   01_lifetimes.exe
//
// Linux/macOS:
//   rustc 01_lifetimes.rs -o 01_lifetimes
//   ./01_lifetimes
// ============================================
