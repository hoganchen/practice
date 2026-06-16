// ============================================================
// Rust 知识点：std::net —— TCP/UDP 网络编程
// 编译：rustc 005_networking.rs && .\005_networking.exe
// ============================================================

use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream, UdpSocket};
use std::thread;

fn main() -> std::io::Result<()> {
    // ========== TCP 服务器 ==========
    // 在独立线程中启动服务器
    let server = thread::spawn(|| -> std::io::Result<()> {
        let listener = TcpListener::bind("127.0.0.1:9876")?;
        println!("TCP 服务器监听 127.0.0.1:9876");

        let (mut stream, addr) = listener.accept()?;
        println!("客户端连接: {}", addr);

        let mut buf = [0u8; 1024];
        let n = stream.read(&mut buf)?;
        println!("收到: {}", String::from_utf8_lossy(&buf[..n]));

        stream.write_all(b"Hello from Rust TCP Server!")?;
        Ok(())
    });

    // 等待服务器启动
    thread::sleep(std::time::Duration::from_millis(100));

    // ========== TCP 客户端 ==========
    let client = thread::spawn(|| -> std::io::Result<()> {
        let mut stream = TcpStream::connect("127.0.0.1:9876")?;
        println!("TCP 客户端连接成功");

        stream.write_all(b"Hello from TCP Client!")?;

        let mut buf = [0u8; 1024];
        let n = stream.read(&mut buf)?;
        println!("服务端回复: {}", String::from_utf8_lossy(&buf[..n]));
        Ok(())
    });

    server.join().unwrap()?;
    client.join().unwrap()?;

    // ========== UDP 通信 ==========
    println!("\n=== UDP 通信 ===");

    let server = thread::spawn(|| -> std::io::Result<()> {
        let socket = UdpSocket::bind("127.0.0.1:9877")?;
        println!("UDP 服务器监听 127.0.0.1:9877");

        let mut buf = [0u8; 1024];
        let (n, src) = socket.recv_from(&mut buf)?;
        println!("UDP 收到来自 {}: {}", src, String::from_utf8_lossy(&buf[..n]));

        socket.send_to(b"UDP Server Ack", src)?;
        Ok(())
    });

    thread::sleep(std::time::Duration::from_millis(50));

    let client = thread::spawn(|| -> std::io::Result<()> {
        let socket = UdpSocket::bind("127.0.0.1:0")?; // 绑定随机端口
        socket.connect("127.0.0.1:9877")?;

        socket.send(b"Hello UDP Server!")?;

        let mut buf = [0u8; 1024];
        let n = socket.recv(&mut buf)?;
        println!("UDP 收到回复: {}", String::from_utf8_lossy(&buf[..n]));
        Ok(())
    });

    server.join().unwrap()?;
    client.join().unwrap()?;

    // ========== 实用方法 ==========
    println!("\n=== 网络工具 ===");

    // 域名解析
    use std::net::ToSocketAddrs;
    let addr = "localhost:8080".to_socket_addrs()?.next().unwrap();
    println!("localhost 解析: {}", addr);

    // 检查本地地址
    let local = TcpListener::bind("0.0.0.0:0")?;
    println!("本地地址: {}", local.local_addr()?);

    // 超时设置
    let stream = TcpStream::connect("127.0.0.1:9876")?;
    stream.set_read_timeout(Some(std::time::Duration::from_secs(5)))?;
    stream.set_write_timeout(Some(std::time::Duration::from_secs(5)))?;
    println!("超时设置成功");

    // ---- IP 地址 ----
    use std::net::{IpAddr, Ipv4Addr};

    let v4: IpAddr = "192.168.1.1".parse().unwrap();
    let v6: IpAddr = "::1".parse().unwrap();
    let localhost_v4 = Ipv4Addr::new(127, 0, 0, 1);

    println!("\nIPv4: {}, IPv6: {}", v4, v6);
    println!("localhost: {}", localhost_v4);
    println!("是回环地址: {}", localhost_v4.is_loopback());

    Ok(())
}
