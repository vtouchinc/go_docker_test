package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"os/signal"
	"strings"
	"syscall"
	"time"
)

func main() {
	go serveHTTP()
	go serveStreams()
	sigs := make(chan os.Signal, 1)
	done := make(chan bool, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		sig := <-sigs
		log.Println(sig)
		done <- true
	}()

	out, _ := exec.Command("ping", "wowzaec2demo.streamlock.net", "-c 5", "-i 3", "-w 10").Output()
	if strings.Contains(string(out), "Destination Host Unreachable") {
		fmt.Println("TANGO DOWN")
	} else {
		fmt.Println("IT'S ALIVEEE")
	}
	ping("wowzaec2demo.streamlock.net", "554")
	ping("192.168.0.110", "8554")

	log.Println("Server Start Awaiting Signal")
	<-done
	log.Println("Exiting")
}

func ping(host string, port string) {
	// host := "wowzaec2demo.streamlock.net"
	// port := "554"
	fmt.Println("***", host, port)
	address := net.JoinHostPort(host, port)
	conn, err := net.DialTimeout("tcp", address, 3*time.Second)
	if err != nil {
		fmt.Println(err)
	} else if conn != nil {
		defer conn.Close()
		fmt.Printf("%s:%s is opened \n", host, port)
	}
}
