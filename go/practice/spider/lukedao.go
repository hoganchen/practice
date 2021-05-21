/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"net/http"
	"io/ioutil"
)

func fetch (url string) string {
	fmt.Println("Fetch Url", url)
	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	// req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Linux; Android 11; HD1900 Build/RKQ1.201022.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045613 Mobile Safari/537.36 MMWEBID/6303 MicroMessenger/7.0.22.1820(0x270016C6) Process/tools WeChat/arm64 Weixin NetType/4G Language/zh_CN ABI/arm64")
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

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	url := "https://luhutms.cdlakecity.com/Ticket/WxH5/index.html?channel_info=C805CF48D6CE5ABA1FECABD704C66BE3986B95EBD5DD0AC79D4128E667C7F85B369863AD276576FF"
	req_body := fetch(url)
	fmt.Printf("web content:\n%v\n", req_body)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
