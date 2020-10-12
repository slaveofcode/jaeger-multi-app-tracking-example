package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	opentracing "github.com/opentracing/opentracing-go"
	"github.com/rs/cors"
	"github.com/slaveofcode/jaeger-multi-app-tracking-example/pinger"
	"github.com/slaveofcode/jaeger-multi-app-tracking-example/service"
	jaegerConf "github.com/uber/jaeger-client-go/config"
)

var closerFunc func() error

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	cfg, err := jaegerConf.FromEnv()

	if err != nil {
		log.Fatalln("Unable to parse jaeger from ENV", err.Error())
	}

	tracer, closer, err := cfg.NewTracer()

	if err != nil {
		log.Fatalln("Unable to initialize tracer", err.Error())
	}

	closerFunc = closer.Close
	opentracing.SetGlobalTracer(tracer)
}

func newRouter() *mux.Router {
	router := mux.NewRouter().StrictSlash(false)

	apiRouter := router.PathPrefix("/api").Subrouter()

	router.
		Path("/ping").
		Methods("POST", "GET").
		Handler(pinger.Ping())

	apiRouter.
		Path("/service/log-access").
		Methods("POST").
		Handler(service.LogAccess())

	return router
}

func main() {
	allowedOrigins := []string{"*"}
	allowedMethods := []string{
		http.MethodGet,
		http.MethodOptions,
		http.MethodPost,
		http.MethodDelete,
		http.MethodPut,
		http.MethodPatch,
	}
	allowedHeaders := []string{
		"*",
	}

	c := cors.New(cors.Options{
		AllowedOrigins: allowedOrigins,
		AllowedMethods: allowedMethods,
		AllowedHeaders: allowedHeaders,
	})

	handlers := c.Handler(newRouter())

	exit := make(chan os.Signal)
	signal.Notify(exit, syscall.SIGINT, syscall.SIGTERM)

	log.Println("Server will started at :8112")
	http.ListenAndServe(":8112", handlers)

	<-exit
	closerFunc()
	os.Exit(1)
}
