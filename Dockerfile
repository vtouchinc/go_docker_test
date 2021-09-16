FROM golang:1.16

RUN apt-get update && \
      apt-get -y install curl nmap net-tools iputils-ping

WORKDIR /go/src/app
COPY .  .

RUN go get -d -v ./...
RUN go install -v ./...

EXPOSE 8083

ENV GO111MODULE=on
ENV GIN_MODE=release
# RUN mkdir $WORKDIR/gocache3
# ENV GOCACHE $WORKDIR/gocache3

RUN mkdir /gocache5
RUN chmod 777 /gocache5
ENV GOCACHE /gocache5

# RUN groupadd -g 999 appuser
# RUN useradd -r -u 999 -g appuser appuser

# USER appuser



# make user : docker
# RUN useradd -m docker && echo "docker:docker" | chpasswd && adduser docker sudo


CMD go run *.go