/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"bytes"
	"runtime"
	"strconv"
	"net/http"
	"io/ioutil"
	"math/rand"

	"./goroutine_pool"
	"golang.org/x/net/html/charset"
)

const task_num = 50

func fetch (url string) string {
	fmt.Println("Fetch Url", url)
	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Http get err:", err)
        return ""
	}
	if resp.StatusCode != http.StatusOK {
		fmt.Println("Http status code:", resp.StatusCode)
		return ""
	}

	defer resp.Body.Close()

	/*
	方法2：处理乱码，参考如下链接：
	golang.org/x/html包下面有个charset.NewReader(r io.Reader, contentType string)方法，它可以将reader的内容转换成指定的编码。
	https://www.jianshu.com/p/91bb5bae837a
	*/
	utf8Reader, _ := charset.NewReader(resp.Body, "UTF-8")
	content, err := ioutil.ReadAll(utf8Reader)
	if err != nil {
		fmt.Println("Read error:", err)
		return ""
	}

	return string(content)
}

// Golang 获取 goroutine id，因此从runtime.Stack获取的字符串中就可以很容易解析出goid信息
// https://chai2010.cn/advanced-go-programming-book/ch3-asm/ch3-08-goroutine-id.html
// https://liudanking.com/performance/golang-%E8%8E%B7%E5%8F%96-goroutine-id-%E5%AE%8C%E5%85%A8%E6%8C%87%E5%8D%97/
func getGoID() uint64 {
    b := make([]byte, 64)
    b = b[:runtime.Stack(b, false)]
    b = bytes.TrimPrefix(b, []byte("goroutine "))
    b = b[:bytes.IndexByte(b, ' ')]
    n, _ := strconv.ParseUint(string(b), 10, 64)
    return n
}

func pool_use_01() {
	pool := goroutine_pool.New(5, task_num)

	for i := 0; i < task_num; i++ {
		pool.Submit(func() {
			wait_time := rand.Intn(5) + 5
			time.Sleep(time.Duration(wait_time) * time.Second)
			routine_id := getGoID()
			fmt.Printf("goroutine id: %v, sleep time: %v\n", routine_id, wait_time)
		})
	}
	pool.Wait()
}

func pool_use_02() {
	url_list := []string{"https://www.kuaidaili.com/free/intr/", "https://www.kuaidaili.com/free/inha/",
	"http://www.nimadaili.com/http/", "http://www.nimadaili.com/https/",
	"http://www.nimadaili.com/gaoni/", "http://www.nimadaili.com/putong/",
	"http://www.kxdaili.com/dailiip.html", "http://www.kxdaili.com/dailiip/2/1.html",
	"http://www.ip3366.net/free/", "http://www.xiladaili.com/gaoni/",
	}

	// url_slice := url_list[:]
	// fmt.Printf("len(url_slice): %v, cap(url_slice): %v\n", len(url_slice), cap(url_slice))

	// for i, v := range url_slice {
	// 	fmt.Printf("index: %v, value: %v\n", i, v)
	// }

	url_slice := make([]string, 0, 10)
	pool := goroutine_pool.New(2, len(url_list))
	http_content_slice := make([]string, 0, 10)
	http_content_map := make(map[string]string)

	fmt.Printf("len(url_list): %v\n", len(url_list))

	for _, urlOrig := range url_list {
		// 这儿有bug，url在循环中已经被修改，但是由于func中没有实际被调用到，所以存在之前的提交的函数还是用到之后的url值，详见打印，
		// 而且map的key数为8，而不是预期的10个
		// fmt.Printf("urlOrig: %v\n", urlOrig)
		pool.Submit(func() {
			url := urlOrig
			fmt.Println("Fetch Url", url)
			client := &http.Client{}
			req, _ := http.NewRequest("GET", url, nil)
			req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")
			resp, err := client.Do(req)
			if err != nil {
				fmt.Println("Http get err:", err)
				http_content_slice = append(http_content_slice, "")
				url_slice = append(url_slice, url)
				http_content_map[url] = ""
				return
			}
			if resp.StatusCode != http.StatusOK {
				fmt.Println("Http status code:", resp.StatusCode)
				http_content_slice = append(http_content_slice, "")
				url_slice = append(url_slice, url)
				http_content_map[url] = ""
				return
			}

			defer resp.Body.Close()

			/*
			方法2：处理乱码，参考如下链接：
			golang.org/x/html包下面有个charset.NewReader(r io.Reader, contentType string)方法，它可以将reader的内容转换成指定的编码。
			https://www.jianshu.com/p/91bb5bae837a
			*/
			utf8Reader, _ := charset.NewReader(resp.Body, "UTF-8")
			content, err := ioutil.ReadAll(utf8Reader)
			if err != nil {
				fmt.Println("Read error:", err)
				http_content_slice = append(http_content_slice, "")
				url_slice = append(url_slice, url)
				http_content_map[url] = ""
				return
			}

			// fmt.Printf("url: %v, content:\n%v\n", url, string(content))
			http_content_slice = append(http_content_slice, string(content))
			url_slice = append(url_slice, url)
			http_content_map[url] = string(content)
			// fmt.Printf("http_content_slice: %v\n", http_content_slice)
		})
	}
	pool.Wait()

	// fmt.Printf("http_content_slice: %v\n", http_content_slice)
	fmt.Printf("len(http_content_slice): %v, cap(http_content_slice): %v\n", len(http_content_slice), cap(http_content_slice))

	for i, v := range http_content_slice {
		fmt.Printf("url: %v, html content:\n%s\n", url_slice[i], v)
	}

	for url, content := range http_content_map {
		fmt.Printf("url: %v, html content: %v\n", url, content)
	}

}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	// pool_use_01()
	pool_use_02()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
