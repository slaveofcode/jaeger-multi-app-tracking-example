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

func LogAccess() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		wireContext, err := opentracing.GlobalTracer().Extract(
			opentracing.HTTPHeaders,
			opentracing.HTTPHeadersCarrier(r.Header))
		if err != nil {
			log.Println("Error while getting previous context", err.Error())
		}

		sp := opentracing.StartSpan(
			"LogAccess",
			opentracing.ChildOf(wireContext))

		defer sp.Finish()

		decoder := json.NewDecoder(r.Body)
		var params LogInfo
		err = decoder.Decode(&params)

		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// simulating long process
		time.Sleep(time.Second * 3)

		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(200)
		w.Write([]byte(`{"status": "ok"}`))
		return
	}
}
