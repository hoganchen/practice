/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-24
*/

package main

import (
	"fmt"
	"time"
	"sync"
	"regexp"
	"net/url"
	"net/http"
	"io/ioutil"
	"strconv"
	"io"
	"bufio"

	// "golang.org/x/text/transform"
	"golang.org/x/text/encoding"
	"golang.org/x/net/html/charset"

	// "golang.org/x/net/html"
)

/*
安装x库，参考链接: http://tyrodw.cn/contents/go-tool/get-x.html

cd $GOPATH/src/golang.org/x
git clone https://github.com/golang/net.git
git clone https://github.com/golang/text.git
*/

var sg sync.WaitGroup //定义一个同步等待的组
var sm sync.Mutex

type s_Proxy struct {
	IP string
	Port string
	Type string
}

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
	if resp.StatusCode != 200 {
		fmt.Println("Http status code:", resp.StatusCode)
		return ""
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Read error", err)
		return ""
	}
	return string(body)
}


func determinEncoding(r io.Reader) encoding.Encoding {

	// 这里的r读取完得保证resp.Body还可读
	body, err := bufio.NewReader(r).Peek(1024)

	if err != nil {
		fmt.Println("Error: peek 1024 byte of body err is ", err)
	}

	// 这里简化,不取是否确认
	e, _, _ := charset.DetermineEncoding(body, "")
	fmt.Printf("determinEncoding func, e: %v\n", e)

	return e
}

func get_proxy(url_list []string, proxy_list *[]s_Proxy) {
	for _, url := range url_list {
		fmt.Printf("url: %v\n", url)

		// resp, err := http.Get(url)
		// if err != nil {
		// 	continue
		// }
		client := &http.Client{}
		req, _ := http.NewRequest("GET", url, nil)
		req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")
		resp, err := client.Do(req)
		if err != nil {
			fmt.Println("Http get err:", err)
			continue
		}

		defer resp.Body.Close()

		// 判断http的返回值
		if resp.StatusCode != http.StatusOK {
			fmt.Println("Error: statuscode is ", resp.StatusCode)
			continue
		}

		time.Sleep(1 * time.Second)

		/*
		方法1：处理乱码，参考如下链接：
		使用方法1处理乱码，需要把import "golang.org/x/text/transform"的注释去掉
		https://aijishu.com/a/1060000000018343
		https://stackoverflow.com/questions/27297328/convert-any-encoding-to-utf-8-in-go
		*/
		// utf8Reader := transform.NewReader(resp.Body, determinEncoding(resp.Body).NewDecoder())

		/*
		方法2：处理乱码，参考如下链接：
		golang.org/x/html包下面有个charset.NewReader(r io.Reader, contentType string)方法，它可以将reader的内容转换成指定的编码。
		https://www.jianshu.com/p/91bb5bae837a
		*/
		utf8Reader, _ := charset.NewReader(resp.Body, "UTF-8")

		// content, err:= ioutil.ReadAll(resp.Body)
		content, err:= ioutil.ReadAll(utf8Reader)
		if err != nil {
			continue
		}

		// fmt.Printf("Content: %s\n", content)
		/*
		https://stackoverflow.com/questions/6770898/unknown-escape-sequence-error-in-go/6770913
		unknown escape sequence错误，在golang中如果字符串内有太多特殊字符，又不想写转义的话，就用反引号替换双引号，把特殊字符次包裹起来。

		总共有 16 种函数按照以下命名模式：
		Find(All)?(String)?(Submatch)?(Index)?
			如果存在 All ，则函数匹配连续的非重叠匹配。
			String 表示参数是一个字符串，否则为字节切片。
			如果存在 Submatch ，则返回值是连续字匹配的切片。字匹配是正则表达式中带括号的子表达式的匹配。示例详见 FindSubmatch 。
			如果存在 Index ，则通过字节索引对来识别匹配项和子匹配项。
		*/
		// site_match, err := regexp.MatchString("xiladaili\\.com", url)
		var re *regexp.Regexp
		fmt.Printf("类型: %v\n", strconv.QuoteToASCII("类型"))

		if matched, _ := regexp.MatchString("xiladaili\\.com", url); matched {
			re, _ = regexp.Compile(`<tr>\s+<td>(\d+\.\d+\.\d+\.\d+):(\d+)</td>\s+<td>(.*?)</td>`)
		} else if matched, _ := regexp.MatchString(`kuaidaili\.com`, url); matched {
			// re, _ = regexp.Compile(`<tr>\s+<td\s+data-title=\"IP\">(\d+\.\d+\.\d+\.\d+)</td>\s+<td\s+data-title=\"PORT\">(\d+)</td>.*?<td\s+data-title=\"类型\">(\w+)</td>`)
			// \p{Unicode脚本类名}  Unicode类 (脚本类)
			// Han表示汉文
			// unicode类，参考https://www.cnblogs.com/sunsky303/p/11051468.html
			re, _ = regexp.Compile(`<tr>\s+<td\s+data-title="IP">(\d+\.\d+\.\d+\.\d+)</td>\s+<td\s+data-title="PORT">(\d+)</td>\s+.*?</td>\s+<td\s+data-title="\p{Han}+">(\w+)</td>`)
			// re, _ = regexp.Compile(`<tr>\s+<td\s+data-title="IP">(\d+\.\d+\.\d+\.\d+)</td>\s+<td\s+data-title="PORT">(\d+)</td>\s+<td\s+data-title=.*?</td>\s+<td\s+data-title="\p{Han}+">(\w+)</td>`)
			// re, _ = regexp.Compile(`<tr>\s+<td\s+data-title="IP">(\d+\.\d+\.\d+\.\d+)</td>\s+<td\s+data-title="PORT">(\d+)</td>\s+<td\s+data-title=.*?</td>\s+<td\s+data-title=".*?">(\w+)</td>`)
			// re, _ = regexp.Compile(`<tr>\s+<td\s+data-title="IP">(\d+\.\d+\.\d+\.\d+)</td>\s+<td\s+data-title="PORT">(\d+)</td>\s+<td\s+data-title=.*?</td>`)
		} else if matched, _ := regexp.MatchString(`nimadaili\.com`, url); matched {
			re, _ = regexp.Compile(`<tr>\s+<td>(\d+\.\d+\.\d+\.\d+):(\d+)</td>\s+<td>(.*?)</td>`)
		} else if matched, _ := regexp.MatchString(`kxdaili\.com`, url); matched {
			re, _ = regexp.Compile(`<tr.*?>\s+<td>(\d+\.\d+\.\d+\.\d+)</td>\s+<td>(\d+)</td>\s+<td>\p{Han}+</td>\s+<td>(.*?)</td>`)
		} else if matched, _ := regexp.MatchString(`ip3366\.net`, url); matched {
			re, _ = regexp.Compile(`<tr>\s+<td>(\d+\.\d+\.\d+\.\d+)</td>\s+<td>(\d+)</td>\s+<td>.*?</td>\s+<td>(.*?)</td>`)
		}

		match := re.FindAllStringSubmatch(string(content), -1)
		// match := re.FindAllString(string(content), -1)
		// fmt.Printf("match:\n%v\n", match)
		for _, param := range match {
			proxy_type := ""
			// (?i)放在模式串之前，表示忽略大小写
			/*
			(re)           numbered capturing group
			(?P<name>re)   named & numbered capturing group
			(?:re)         non-capturing group
			(?flags)       set flags within current group; non-capturing
			(?flags:re)    set flags during re; non-capturing

			Flag syntax is xyz (set) or -xyz (clear) or xy-z (set xy, clear z). The flags are:
			i              case-insensitive (default false)
			m              multi-line mode: ^ and $ match begin/end line in addition to begin/end text (default false)
			s              let . match \ (default false)
			U              ungreedy: swap meaning of x* and x*?, x+ and x+?, etc (default false)
			*/
			re_match, _ := regexp.Match(`(?i)HTTPS`, []byte(param[3]))
			// fmt.Printf("re_match: %v, err: %v\n", re_match, err)

			if re_match {
				proxy_type = "https"
			} else {
				proxy_type = "http"
			}
			// fmt.Printf("IP: %s, Port: %v, Type: %v, Type String: %v\n", param[1], param[2], proxy_type, param[3])

			*proxy_list = append(*proxy_list, s_Proxy{IP:param[1], Port:param[2], Type:proxy_type})
			// fmt.Printf("In get_proxy function, proxy_list address: %p\n", proxy_list)
		}
	}
}

func verify_one_proxy_address(proxy_addr s_Proxy, verify_proxy_list *[]s_Proxy) {
	// fmt.Printf("proxy_addr: %v\n", proxy_addr)
	proxy_address := string(proxy_addr.Type + "://" + proxy_addr.IP + ":" + proxy_addr.Port)
	fmt.Printf("proxy_address: %v\n", proxy_address)

	// proxy_url, err := url.Parse(proxy_address)
	// if err != nil {
	// 	continue
	// }

	proxy_url := func(_ *http.Request) (*url.URL, error) {
		return url.Parse(proxy_address)
	}

	httpTransport := &http.Transport{
		Proxy: proxy_url,
	}

	httpClient := &http.Client{
		Transport: httpTransport,
		// Timeout: 5 * time.Second,
	}

	req, err := http.NewRequest("GET", "https://httpbin.org/get", nil)
	fmt.Printf("req: %v, err: %v\n", req, err)
	if err != nil {
		// handle error
		return
	}

	resp, err := httpClient.Do(req)
	fmt.Printf("resp: %v, err: %v\n", resp, err)
	if err != nil {
		return
	}

	body, err := ioutil.ReadAll(resp.Body)
	fmt.Printf("body: %v, err: %v\n", body, err)
	if err != nil {
		// handle error
		return
	}

	resp.Body.Close()
	*verify_proxy_list = append(*verify_proxy_list, proxy_addr)

	fmt.Println(string(body))
}

func verify_proxy_address(proxy_list []s_Proxy, verify_proxy_list *[]s_Proxy, sg sync.WaitGroup) {
	for _, proxy := range proxy_list {
		verify_one_proxy_address(proxy, verify_proxy_list)
	}
}

func verify_one_proxy_address_by_goroutines(proxy_addr s_Proxy, verify_proxy_list *[]s_Proxy) {
	// fmt.Printf("proxy_addr: %v\n", proxy_addr)
	proxy_address := string(proxy_addr.Type + "://" + proxy_addr.IP + ":" + proxy_addr.Port)
	fmt.Printf("proxy_address: %v\n", proxy_address)

	// proxy_url, err := url.Parse(proxy_address)
	// if err != nil {
	// 	continue
	// }

	proxy_url := func(_ *http.Request) (*url.URL, error) {
		return url.Parse(proxy_address)
	}

	httpTransport := &http.Transport{
		Proxy: proxy_url,
	}

	httpClient := &http.Client{
		Transport: httpTransport,
		Timeout: 20 * time.Second,
	}

	// sg作为参数传递貌似有问题，所以作为全局变量，原因是go的函数是值传递，用指针方式即可
	defer sg.Done() //减去一个计数

	req, err := http.NewRequest("GET", "https://httpbin.org/get", nil)
	fmt.Printf("req: %v, err: %v\n", req, err)
	if err != nil {
		// handle error
		return
	}

	resp, err := httpClient.Do(req)
	fmt.Printf("resp: %v, err: %v\n", resp, err)
	if err != nil {
		return
	}

	body, err := ioutil.ReadAll(resp.Body)
	fmt.Printf("body: %v, err: %v\n", body, err)
	if err != nil {
		// handle error
		return
	}

	resp.Body.Close()

	// slice的append不是协程安全，所以用锁来解决
	sm.Lock()
	*verify_proxy_list = append(*verify_proxy_list, proxy_addr)
	sm.Unlock()

	fmt.Println(string(body))
}

func verify_proxy_address_by_goroutines(proxy_list []s_Proxy, verify_proxy_list *[]s_Proxy) {
	for _, proxy := range proxy_list {
		sg.Add(1) //添加一个计数
		go verify_one_proxy_address_by_goroutines(proxy, verify_proxy_list)
	}

	sg.Wait() //阻塞直到所有任务完成
}

func main() {
	start := time.Now()
	// https://strconv.com/posts/time-fmt/
	// The reference time used in the layouts is the specific time:
	//	Mon Jan 2 15:04:05 MST 2006
	// 也就是说，这个时间按代表的部分拆开，其实可以理解为一个递增序列（01 02 03 04 05 06 07）
	// 先感叹下语言设计者的用心：2006-01-02 15:04:05这个日期，不但挺好记的，而且用起来也比较方便。
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	proxy_list := make([]s_Proxy, 0)
	// url_list := []string{"http://www.xiladaili.com/putong/", "http://www.xiladaili.com/gaoni/", "https://www.kuaidaili.com/free/intr/", "https://www.kuaidaili.com/free/inha/"}
	url_list := []string{"https://www.kuaidaili.com/free/intr/", "https://www.kuaidaili.com/free/inha/",
						 "http://www.nimadaili.com/http/", "http://www.nimadaili.com/https/",
						 "http://www.nimadaili.com/gaoni/", "http://www.nimadaili.com/putong/",
						 "http://www.kxdaili.com/dailiip.html", "http://www.kxdaili.com/dailiip/2/1.html",
						 "http://www.ip3366.net/free/",
						}
	// url_list := []string{"https://www.kuaidaili.com/free/intr/", "http://www.nimadaili.com/https/"}

	fmt.Printf("In main function, proxy_list address: %p\n", &proxy_list)
	get_proxy(url_list, &proxy_list)
	fmt.Printf("len(proxy_list): %v, proxy_list:\n%v\n", len(proxy_list), proxy_list)

	valid_proxy_list := make([]s_Proxy, 0)
	// verify_proxy_address(proxy_list, &valid_proxy_list)
	verify_proxy_address_by_goroutines(proxy_list, &valid_proxy_list)

	fmt.Printf("len(valid_proxy_list): %v, valid_proxy_list:\n%v\n", len(valid_proxy_list), valid_proxy_list)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
