package service

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	opentracing "github.com/opentracing/opentracing-go"
)

type LogInfo struct {
	Requester       string    `json:"requester"`
	ServiceProvided string    `json:"serviceProvider"`
	Action          string    `json:"action"`
	TimeRequested   time.Time `json:"timeRequested"`
}

func wrapSpan(operation string, f func(), ctx opentracing.SpanContext) {
	s := opentracing.StartSpan(operation, opentracing.ChildOf(ctx))
	defer s.Finish()

	// run the function
	f()
}

func writeToDB(data string) {
	// simulating long process
	time.Sleep(time.Second * 3)
}

func makeCache() {
	// simulating long process
	time.Sleep(time.Second * 1)
}

func LogAccess() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		wireContext, err := opentracing.GlobalTracer().Extract(
			opentracing.HTTPHeaders,
			opentracing.HTTPHeadersCarrier(r.Header))
		var span opentracing.Span
		if err != nil {
			log.Println("Error while getting previous context", err.Error())
			span = opentracing.StartSpan(
				"Pinger",
				opentracing.ChildOf(wireContext))
		} else {
			span = opentracing.StartSpan(
				"Pinger",
			)
		}

		defer span.Finish()

		decoder := json.NewDecoder(r.Body)
		var params LogInfo
		err = decoder.Decode(&params)

		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		wrapSpan("Database", func() {
			writeToDB("something to write")
		}, span.Context())

		wrapSpan("Cache", func() {
			makeCache()
		}, span.Context())

		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(200)
		w.Write([]byte(`{"status": "ok"}`))
		return
	}
}
