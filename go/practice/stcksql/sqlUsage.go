/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

func dbQueryExample() {
	const (
		mysqlUser = "gostck"
		mysqlPwd  = "stck&sql"
		mysqlDb   = "gostock"

		updateStatusTable  = "update_status_data"
	)

	type UpdateTableTag struct {
		Name string `json:"name"`
		Date string `json:"date"`
	}

	//Open up our database connection.
	//I've set up a database on my local machine using phpmyadmin.
	//The database is called testDb
	//db, err := sql.Open("mysql", "stck:stck&sql@tcp(127.0.0.1:3306)/stock")
	dataSource := fmt.Sprintf("%s:%s@tcp(127.0.0.1:3306)/%s", mysqlUser, mysqlPwd, mysqlDb)
	db, err := sql.Open("mysql", dataSource)

	//if there is an error opening the connection, handle it
	if err != nil {
		panic(err.Error())
	}

	//defer the close till after the main function has finished
	//executing
	defer db.Close()

	//Execute the query
	results, err := db.Query(fmt.Sprintf("select name, date from %v", updateStatusTable))
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}

	var tag UpdateTableTag
	for results.Next() {
		//for each row, scan the result into our tag composite object
		err = results.Scan(&tag.Name, &tag.Date)
		if err != nil {
			panic(err.Error()) //proper error handling instead of panic in your app
		}

		//and then print out the tag's Name attribute
		fmt.Printf("Name: %v, Date: %v\n", tag.Name, tag.Date)
	}
}

func dbExec(sentence string) {
	const (
		mysqlUser = "gostck"
		mysqlPwd  = "stck&sql"
		mysqlDb   = "gostock"

		updateStatusTable  = "update_status_data"
	)

	dataSource := fmt.Sprintf("%s:%s@tcp(127.0.0.1:3306)/%s", mysqlUser, mysqlPwd, mysqlDb)
	db, err := sql.Open("mysql", dataSource)

	//if there is an error opening the connection, handle it
	if err != nil {
		panic(err.Error())
	}

	//defer the close till after the main function has finished
	//executing
	defer db.Close()

	//Execute the query
	_, err = db.Exec(sentence)
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	dbQueryExample()
	dbExec("select * from update_status_data")

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
