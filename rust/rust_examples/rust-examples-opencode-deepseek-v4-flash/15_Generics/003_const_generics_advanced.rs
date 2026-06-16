// ============================================================
// Rust 知识点：const 泛型进阶 —— 泛型表达式和多类型
// 编译：rustc 003_const_generics_advanced.rs && .\003_const_generics_advanced.exe
// ============================================================

// ========== 基础 const 泛型 ==========
// const N: usize 在编译期确定
fn array_sum<const N: usize>(arr: [i32; N]) -> i32 {
    let mut sum = 0;
    for i in 0..N {
        sum += arr[i];
    }
    sum
}

// ========== 多个 const 泛型参数 ==========
struct Matrix<T, const ROWS: usize, const COLS: usize> {
    data: [[T; COLS]; ROWS],
}

impl<T: Copy + Default, const ROWS: usize, const COLS: usize>
    Matrix<T, ROWS, COLS>
{
    fn new() -> Self {
        Matrix {
            data: [[T::default(); COLS]; ROWS],
        }
    }

    fn from(data: [[T; COLS]; ROWS]) -> Self {
        Matrix { data }
    }

    fn transpose(&self) -> Matrix<T, COLS, ROWS> {
        let mut result = Matrix::<T, COLS, ROWS>::new();
        for i in 0..ROWS {
            for j in 0..COLS {
                result.data[j][i] = self.data[i][j];
            }
        }
        result
    }
}

// ========== const 泛型字符串 ==========
struct FixedString<const N: usize> {
    data: [u8; N],
    len: usize,
}

impl<const N: usize> FixedString<N> {
    fn from_str(s: &str) -> Self {
        let bytes = s.as_bytes();
        let len = bytes.len().min(N);
        let mut data = [0u8; N];
        data[..len].copy_from_slice(&bytes[..len]);
        FixedString { data, len }
    }

    fn as_str(&self) -> &str {
        std::str::from_utf8(&self.data[..self.len]).unwrap()
    }

    fn capacity(&self) -> usize {
        N
    }
}

// ========== const 泛型特化（用于优化不同类型大小的数组）==========
trait Describe {
    fn describe() -> String;
}

impl<const N: usize> Describe for [i32; N] {
    fn describe() -> String {
        format!("长度 {} 的数组", N)
    }
}

fn main() {
    // ---- 基础 const 泛型 ----
    let arr1 = [1, 2, 3];
    let arr2 = [1, 2, 3, 4, 5];

    println!("arr1 sum: {}", array_sum(arr1));
    println!("arr2 sum: {}", array_sum(arr2));

    // 不同类型推导出不同 N
    println!("type: {}", std::any::type_name_of_val(&arr1));

    // ---- 多 const 泛型参数 ----
    let m = Matrix::<i32, 2, 3>::from([[1, 2, 3], [4, 5, 6]]);
    let mt = m.transpose();

    println!("Matrix 转置: {:?}", mt.data);

    // ---- FixedString ----
    let s1 = FixedString::<32>::from_str("Hello, Const Generics!");
    println!("FixedString: {} (cap: {})", s1.as_str(), s1.capacity());

    let s2 = FixedString::<8>::from_str("Too long string truncated");
    println!("Truncated: {} (cap: {})", s2.as_str(), s2.capacity());

    // ---- const 泛型特化 ----
    println!("\nConst 泛型特化:");
    println!("[i32; 3]: {}", <[i32; 3] as Describe>::describe());
    println!("[i32; 0]: {}", <[i32; 0] as Describe>::describe());

}
