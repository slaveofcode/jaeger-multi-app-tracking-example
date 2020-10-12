package pinger

import (
	"encoding/json"
	"log"
	"net/http"

	opentracing "github.com/opentracing/opentracing-go"
)

func Ping() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		wireContext, err := opentracing.GlobalTracer().Extract(
			opentracing.HTTPHeaders,
			opentracing.HTTPHeadersCarrier(r.Header))
		if err != nil {
			log.Println("Error while getting previous context", err.Error())
		}

		sp := opentracing.StartSpan(
			"Pinger",
			opentracing.ChildOf(wireContext))

		defer sp.Finish()

		clientHeaders := make(map[string]interface{})

		for key, vals := range r.Header {

			var headerValues string
			for _, val := range vals {
				headerValues += " " + val
			}

			clientHeaders[key] = headerValues
		}

		jsonHeaders, _ := json.Marshal(clientHeaders)

		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(200)
		w.Write(jsonHeaders)
		return
	}
}
