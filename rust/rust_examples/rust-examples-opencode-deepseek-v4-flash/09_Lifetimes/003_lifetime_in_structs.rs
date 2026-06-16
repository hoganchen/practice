// ============================================================
// Rust 知识点：结构体中的生命周期
// 结构体可以包含引用字段，但需要生命周期标注
// 编译：rustc 003_lifetime_in_structs.rs && .\003_lifetime_in_structs.exe
// ============================================================

// ---- 包含引用的结构体必须标注生命周期 ----
struct Excerpt<'a> {
    // 这个结构体持有对 String 的引用，不能比被引用的 String 活得更久
    part: &'a str,
}

// 实现方法也需要生命周期标注
impl<'a> Excerpt<'a> {
    // 省略规则适用：&self 是 &Excerpt<'a>，返回值是 &str
    fn get_part(&self) -> &str {
        self.part
    }

    // 多输入引用
    fn announce_and_return(&self, announcement: &str) -> &str {
        println!("公告: {}", announcement);
        self.part
    }
}

// ---- 多个生命周期参数 ----
struct Pair<'a, 'b> {
    first: &'a str,
    second: &'b str,
}

impl<'a, 'b> Pair<'a, 'b> {
    fn longest(&self) -> &str
    where
        'a: 'b, // 'a 至少活得和 'b 一样久
    {
        if self.first.len() >= self.second.len() {
            self.first
        } else {
            self.second
        }
    }
}

fn main() {
    // ---- 结构体生命周期示例 ----
    let novel = String::from("从前有座山...山上有个庙...");
    let first_sentence = novel.split('.').next().expect("没有找到句号");

    let excerpt = Excerpt {
        part: first_sentence,
    };

    println!("摘录: {}", excerpt.part);
    println!("通过方法获取: {}", excerpt.get_part());

    // ---- 生命周期约束 ----
    // excerpt 不能活得比 novel 更久
    // 下面的代码会编译错误：
    // let excerpt;
    // {
    //     let novel = String::from("临时文本");
    //     excerpt = Excerpt { part: &novel };
    // }
    // println!("{}", excerpt.part); // 错误！novel 已被释放

    // ---- 多生命周期 ----
    let s1 = String::from("短文本");
    let s2 = String::from("这是一个长文本");

    let pair = Pair {
        first: &s1,
        second: &s2,
    };

    println!("较长的: {}", pair.longest());

    // ---- 'static 生命周期 ----
    // 'static 引用存活于整个程序运行期间
    let static_str: &'static str = "我存活于整个程序";
    println!("{}", static_str);
}
