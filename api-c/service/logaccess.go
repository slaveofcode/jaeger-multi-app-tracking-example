package service

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	opentracing "github.com/opentracing/opentracing-go"
	"github.com/opentracing/opentracing-go/ext"
)

type LogInfo struct {
	Requester       string    `json:"requester"`
	ServiceProvided string    `json:"serviceProvider"`
	Action          string    `json:"action"`
	TimeRequested   time.Time `json:"timeRequested"`
}

func wrapSpan(operation string, f func(span opentracing.Span), ctx opentracing.SpanContext) {
	s := opentracing.StartSpan(operation, opentracing.ChildOf(ctx))
	defer s.Finish()

	// run the function
	f(s)
}

func writeToDB(data string) {
	// simulating long process between 100 - 5000ms
	time.Sleep(time.Millisecond * time.Duration(rand.Intn(5000-100)+100))
}

func publishEventToSubscribers() {
	// simulating long process between 300 - 500ms
	time.Sleep(time.Millisecond * time.Duration(rand.Intn(500-300)+300))
}

func LogAccess() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tracer := opentracing.GlobalTracer()
		spanCtx, err := tracer.Extract(
			opentracing.HTTPHeaders,
			opentracing.HTTPHeadersCarrier(r.Header),
		)

		clientHeaders := make(map[string]interface{})

		for key, vals := range r.Header {

			var headerValues string
			for _, val := range vals {
				headerValues += " " + val
			}

			clientHeaders[key] = headerValues
		}

		fmt.Println(clientHeaders)

		var span opentracing.Span
		if err != nil {
			log.Println("Error while getting previous context", err.Error())
			span = opentracing.StartSpan(
				"LogAccess",
			)
		} else {
			span = opentracing.StartSpan(
				"LogAccess",
				ext.RPCServerOption(spanCtx),
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

		wrapSpan("writeToDB", func(sp opentracing.Span) {
			sp.Log(opentracing.LogData{
				Event: "Save to Database",
				Payload: map[string]interface{}{
					"example": "data 123",
				},
			})
			writeToDB("something to write")
		}, span.Context())

		wrapSpan("publishEventToSubscribers", func(sp opentracing.Span) {
			sp.Log(opentracing.LogData{
				Event: "Make a Cache",
				Payload: map[string]interface{}{
					"cacheID": "xyz",
				},
			})
			publishEventToSubscribers()
		}, span.Context())

		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(200)
		w.Write([]byte(`{"status": "ok"}`))
		return
	}
}
