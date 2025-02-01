FROM golang:1.23-alpine3.19 AS build

WORKDIR /app

COPY . .

RUN go mod download && go build -o /go/bin/main cmd/api/main.go

FROM alpine:3.19

WORKDIR /app

RUN apk add --no-cache \
    ca-certificates \
    curl \
    bash

COPY --from=build /go/bin/main /app/main

CMD [ "/app/main" ]