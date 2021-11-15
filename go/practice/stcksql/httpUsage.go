/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"time"
)

func httpFetchWithHeader(url string) string {
	fmt.Printf("Fetch Url: %v\n", url)
	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Http get err: %v\n", err)
		return ""
	}
	if resp.StatusCode != 200 {
		fmt.Printf("Http status code: %v\n", resp.StatusCode)
		return ""
	}

	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Read error: %v\n", err)
		return ""
	}

	return string(body)
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	fmt.Printf("httpFetchWithHeader(\"http://www.baidu.com\"):\n%v\n", httpFetchWithHeader("http://www.baidu.com"))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
