package pinger

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	opentracing "github.com/opentracing/opentracing-go"
)

func Ping() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		wireContext, err := opentracing.GlobalTracer().Extract(
			opentracing.HTTPHeaders,
			opentracing.HTTPHeadersCarrier(r.Header))

		var span opentracing.Span
		if err != nil {
			log.Println("No previous context:", err.Error())
			span = opentracing.StartSpan(
				"Pinger",
				opentracing.ChildOf(wireContext))
		} else {
			span = opentracing.StartSpan(
				"Pinger",
			)
		}

		defer span.Finish()

		clientHeaders := make(map[string]interface{})

		for key, vals := range r.Header {

			var headerValues string
			for _, val := range vals {
				headerValues += " " + val
			}

			clientHeaders[key] = headerValues
		}

		jsonHeaders, _ := json.Marshal(clientHeaders)

		if strings.Contains(clientHeaders["User-Agent"].(string), "axios") {
			span.SetTag("client-type", "service")
		} else {
			span.SetTag("client-type", "browser")
		}

		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(200)
		w.Write(jsonHeaders)
		return
	}
}
