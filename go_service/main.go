package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"net/url"
)

type Item struct {
	ID     int    `json:"id"`
	Title  string `json:"title"`
	Type   string `json:"type"`
	Status string `json:"status"`
	Rating *int   `json:"rating"`
}

func main() {
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/random", randomHandler)

	fmt.Println("Go server started on http://127.0.0.1:8080")

	http.ListenAndServe(":8080", nil)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Go работает!")
}

func randomHandler(w http.ResponseWriter, r *http.Request) {
	itemType := r.URL.Query().Get("type")
	status := r.URL.Query().Get("status")

	params := url.Values{}

	if itemType != "" {
		params.Set("type", itemType)
	}

	if status != "" {
		params.Set("status", status)
	}

	pythonURL := "http://127.0.0.1:8000/items"

	if len(params) > 0 {
		pythonURL += "?" + params.Encode()
	}

	response, err := http.Get(pythonURL)

	if err != nil {
		http.Error(w, "Не удалось связаться с Python", http.StatusInternalServerError)

		return
	}

	defer response.Body.Close()

	var items []Item
	err = json.NewDecoder(response.Body).Decode(&items)

	if err != nil {
		http.Error(w, "Не удалось прочитать JSON", http.StatusInternalServerError)

		return
	}

	if len(items) == 0 {
		http.Error(w, "Коллекция пустая", http.StatusNotFound)

		return
	}

	randomIndex := rand.Intn(len(items))
	selectedItem := items[randomIndex]

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	w.Header().Set(
		"Access-Control-Allow-Origin",
		"*",
	)

	json.NewEncoder(w).Encode(selectedItem)
}
