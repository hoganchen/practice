/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/tidwall/gjson"
)

const (
	mysqlUser = "stck"
	mysqlPwd  = "stck&sql"
	mysqlDb   = "stock"
	todayCodeTable = "go_code_data"

	maxStockNumPerPage = 1000
)

/*

*/
type Tag struct {
	Name string `json:"id"`
	Date string `json:"name"`
}

func httpFetchWithHeader (url string) string {
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
		fmt.Println("Read error:", err)
		return ""
	}

	return string(body)
}

func httpFetch(url string) string {
	//fmt.Println("Fetch Url", url)

	resp, err := http.Get(url)
	if err != nil {
		fmt.Println("Http get err:", err)
		return ""
	}
	if resp.StatusCode != 200 {
		fmt.Println("Http status code:", resp.StatusCode)
		return ""
	}

	//fmt.Println("Http status code:", resp.StatusCode)
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Read error:", err)
		return ""
	}

	return string(body)
}

func getAllStockData() string {
	firstUrl := "http://29.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=0&np=1&fltt=2&invt=2&fid=f12" +
		"&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23" +
		"&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152"

	firstUrlContent := httpFetch(firstUrl)
	//fmt.Printf("url: %v, content:\n%v\n", url, firstUrlContent)
	stockNum := int(gjson.Get(firstUrlContent, "data.total").Int())
	pageNum := (stockNum - 1) / maxStockNumPerPage + 1
	fmt.Printf("stockNum: %v, pageNum: %v\n", stockNum, pageNum)

	dataSource := fmt.Sprintf("%s:%s@tcp(127.0.0.1:3306)/%s", mysqlUser, mysqlPwd, mysqlDb)
	db, err := sql.Open("mysql", dataSource)

	// if there is an error opening the connection, handle it
	if err != nil {
		panic(err.Error())
	}

	// truncate table
	truncStr := fmt.Sprintf("truncate table %s", todayCodeTable)
	db.Exec(truncStr)

	// defer the close till after the main function has finished
	// executing
	defer db.Close()

	var wg sync.WaitGroup
	for i := 1; i <= pageNum; i++ {
		wg.Add(1)
		go func(num int) {
			defer wg.Done()
			serverID := rand.Intn(99) + 1

			dataUrl := fmt.Sprintf("http://%d.push2.eastmoney.com/api/qt/clist/get?pn=%d&pz=%d&po=0&np=1&fltt=2&invt=2&fid=f12" +
				"&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23" +
				"&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152", serverID, num, maxStockNumPerPage)
			dataUrlContent := httpFetch(dataUrl)

			itemNum := int(gjson.Get(dataUrlContent, "data.diff.#").Int())
			fmt.Printf("pageNum: %v, itemNum: %v\n", num, itemNum)
			execStr := fmt.Sprintf("insert into %s (code, name) values", todayCodeTable)
			data := " "

			for j := 0; j < itemNum; j++ {
				//dataPath := fmt.Sprintf("data.diff.%d", j)
				//fmt.Printf("diff: %v\n", gjson.Get(dataUrlContent, dataPath))

				codePath := fmt.Sprintf("data.diff.%d.f12", j)
				namePath := fmt.Sprintf("data.diff.%d.f14", j)
				code := gjson.Get(dataUrlContent, codePath).String()
				name := gjson.Get(dataUrlContent, namePath).String()
				fmt.Printf("code: %v(%T), name: %v(%T)\n", code, code, name, name)
				//最后一行数据后，不能有逗号
				if j < itemNum - 1 {
					data = data + "(" + code + ", \"" + name + "\"), "
				} else {
					data = data + "(" + code + ", \"" + name + "\")"
				}
			}

			//fmt.Printf("execStr: %v, data: %v\n", execStr, data)
			fmt.Printf("execString: %v\n", execStr + data)

			// Execute the query
			_, err = db.Exec(execStr + data)
			if err != nil {
				panic(err.Error()) // proper error handling instead of panic in your app
			}
		}(i)
	}

	wg.Wait()
	return ""
}

func dbQuery() {
	// Open up our database connection.
	// I've set up a database on my local machine using phpmyadmin.
	// The database is called testDb
	//db, err := sql.Open("mysql", "stck:stck&sql@tcp(127.0.0.1:3306)/stock")
	dataSource := fmt.Sprintf("%s:%s@tcp(127.0.0.1:3306)/%s", mysqlUser, mysqlPwd, mysqlDb)
	db, err := sql.Open("mysql", dataSource)

	// if there is an error opening the connection, handle it
	if err != nil {
		panic(err.Error())
	}

	// defer the close till after the main function has finished
	// executing
	defer db.Close()

	// Execute the query
	results, err := db.Query("SELECT * FROM update_status_data")
	if err != nil {
		panic(err.Error()) // proper error handling instead of panic in your app
	}

	for results.Next() {
		var tag Tag
		// for each row, scan the result into our tag composite object
		err = results.Scan(&tag.Name, &tag.Date)
		if err != nil {
			panic(err.Error()) // proper error handling instead of panic in your app
		}
		// and then print out the tag's Name attribute
		log.Printf("Name: %v, Date: %v\n", tag.Name, tag.Date)
	}
}

func dbExec(sentence string) {
	dataSource := fmt.Sprintf("%s:%s@tcp(127.0.0.1:3306)/%s", mysqlUser, mysqlPwd, mysqlDb)
	db, err := sql.Open("mysql", dataSource)

	// if there is an error opening the connection, handle it
	if err != nil {
		panic(err.Error())
	}

	// defer the close till after the main function has finished
	// executing
	defer db.Close()

	// Execute the query
	_, err = db.Exec(sentence)
	if err != nil {
		panic(err.Error()) // proper error handling instead of panic in your app
	}
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	//fmt.Printf("HttpFetchWithHeader Content: \n%v\n", httpFetchWithHeader("http://www.baidu.com"))
	//fmt.Printf("httpFetch Content: \n%v\n", httpFetch("http://www.baidu.com"))
	getAllStockData()
	//dbQuery()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
