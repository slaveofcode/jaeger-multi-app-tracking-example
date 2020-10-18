# Jaeger Multi App Tracking Example 📊 
Example implementation of multi application tracking with jaeger tracing.

This project has 3 different applications, 

1. `api-a`, is simple NodeJs app called **Service A**
2. `api-b`, is simple NodeJs app called **Service B**
3. `api-c`, is simple Golang app called **Service C** 

In operation, the **Service A** is depends on **Service B** and **C**, mimicking microservices architecture, so then you'll get the idea about how opentracing works in practice using Jaeger as a backend.

### How to Start
1. Make sure your environment already setup for NodeJs and Go (with go module support)
2. Clone this repostory `git clone --depth=1 git@github.com:slaveofcode/jaeger-multi-app-tracking-example.git`
3. Start **Service A** by go to `api-a` directory and run command `npm start`, the same steps applied to **Service B** on `api-b`
4. Start **Service C** by go to `api-c` directory and run command `go run server.go`
5. Start the Jaeger `jaeger-all-in-one` service, you can use the *binary* or using its **Docker** image as [described here](https://www.jaegertracing.io/docs/1.18/getting-started/) 
6. Start making some requests by hitting [http://localhost:8110/api/users](http://localhost:8110/api/users) and [http://localhost:8110/api/users/1](http://localhost:8110/api/users/1)
7. Visit **Jaeger UI** at [http://localhost:16686](http://localhost:16686) and select **Service A** on the Filter Search box to see some traces.

### LICENSE

MIT License

Copyright (c) 2020 Aditya Kresna

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
