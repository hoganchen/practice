/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"database/sql"
	_ "github.com/go-sql-driver/mysql"
)

var MysqlUser = "stck"
var MysqlPwd = "stck&sql"
var MysqlDb = "stock"

type Tag struct {
	Name string `json:"id"`
	Date string `json:"name"`
}

func HttpFetchWithHeader (url string) string {
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

func GetAllStockData() string {
	url := "http://29.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=0&np=1&fltt=2&invt=2&fid=f12" +
		"&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23" +
		"&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152"

	urlContent := httpFetch(url)
	fmt.Printf("url: %v, content:\n%v\n", url, urlContent)

	return ""
}

func DbOperation() {
	// Open up our database connection.
	// I've set up a database on my local machine using phpmyadmin.
	// The database is called testDb
	//db, err := sql.Open("mysql", "stck:stck&sql@tcp(127.0.0.1:3306)/stock")
	dataSource := fmt.Sprintf("%s:%s@tcp(127.0.0.1:3306)/%s", MysqlUser, MysqlPwd, MysqlDb)
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

func MysqlExec(sentence string) {
	dataSource := fmt.Sprintf("%s:%s@tcp(127.0.0.1:3306)/%s", MysqlUser, MysqlPwd, MysqlDb)
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

	//fmt.Printf("HttpFetchWithHeader Content: \n%v\n", HttpFetchWithHeader("http://www.baidu.com"))
	//fmt.Printf("httpFetch Content: \n%v\n", httpFetch("http://www.baidu.com"))
	//GetAllStockData()
	DbOperation()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
