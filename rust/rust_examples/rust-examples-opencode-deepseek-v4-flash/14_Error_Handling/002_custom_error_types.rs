// ============================================================
// Rust 知识点：自定义错误类型 —— 实现 Error trait
// 编译：rustc 002_custom_error_types.rs && .\002_custom_error_types.exe
// ============================================================

use std::error::Error;
use std::fmt;

// ---- 自定义错误类型 ----
#[derive(Debug)]
enum AppError {
    NotFound(String),
    PermissionDenied,
    InvalidInput { field: String, message: String },
    DatabaseError(Box<dyn Error>), // 包装其他错误
}

// 为自定义错误实现 Display
impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::NotFound(resource) => write!(f, "未找到: {}", resource),
            AppError::PermissionDenied => write!(f, "权限不足"),
            AppError::InvalidInput { field, message } => {
                write!(f, "输入错误 [{}]: {}", field, message)
            }
            AppError::DatabaseError(e) => write!(f, "数据库错误: {}", e),
        }
    }
}

// 实现 Error trait
impl Error for AppError {
    // 返回错误来源（用于错误链）
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            AppError::DatabaseError(e) => Some(e.as_ref()),
            _ => None,
        }
    }
}

// ---- 使用自定义错误 ----
fn find_user(id: u32) -> Result<String, AppError> {
    match id {
        0 => Err(AppError::InvalidInput {
            field: "id".to_string(),
            message: "ID 不能为 0".to_string(),
        }),
        1 => Ok(String::from("Admin")),
        _ => Err(AppError::NotFound(format!("用户 ID {}", id))),
    }
}

// ---- 转换标准错误为自定义错误 ----
use std::fs::File;

fn read_config() -> Result<String, AppError> {
    let mut file = File::open("config.toml")
        .map_err(|e| AppError::DatabaseError(Box::new(e)))?;
    let mut content = String::new();
    file.read_to_string(&mut content)
        .map_err(|e| AppError::DatabaseError(Box::new(e)))?;
    Ok(content)
}

fn main() {
    // ---- 使用自定义错误 ----
    match find_user(0) {
        Ok(name) => println!("找到用户: {}", name),
        Err(e) => {
            eprintln!("错误: {}", e);
            // 打印错误链
            let mut source = e.source();
            while let Some(err) = source {
                eprintln!("  原因: {}", err);
                source = err.source();
            }
        }
    }

    // ---- 错误类型转换 ----
    use std::io::Read;

    match find_user(42) {
        Ok(name) => println!("用户: {}", name),
        Err(e) => eprintln!("{}", e),
    }

    // ---- 使用 Box<dyn Error> 作为通用错误 ----
    fn fallible_operation() -> Result<i32, Box<dyn Error>> {
        let val = "42".parse::<i32>()?; // ParseIntError -> Box<dyn Error>
        if val < 0 {
            return Err(AppError::InvalidInput {
                field: "value".to_string(),
                message: "不能为负数".to_string(),
            }.into());
        }
        Ok(val)
    }

    match fallible_operation() {
        Ok(v) => println!("值: {}", v),
        Err(e) => eprintln!("通用错误: {}", e),
    }
}
