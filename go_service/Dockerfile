FROM golang:1.27-alpine AS builder

WORKDIR /app

COPY go.mod .
COPY main.go .

RUN go build -o server .

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/server .

CMD ["./server"]