/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11

https://github.com/carwale/golibraries/blob/master/workerpool/Worker.go

该方案参考了如下链接：
https://stackoverflow.com/questions/18267460/how-to-use-a-goroutine-pool
http://marcio.io/2015/07/handling-1-million-requests-per-minute-with-golang/
https://github.com/itfanr/articles-about-golang/blob/master/2016-10/1.handling-1-million-requests-per-minute-with-golang.md

该方案用于解决指定场合的问题，即不需要处理返回结果，以及无参数传递
*/

package main

import (
	"fmt"
	"sync"
	"time"

	"github.com/carwale/golibraries/gologger"
	"github.com/prometheus/client_golang/prometheus"
)

// IJob : Interface for the Job to be processed
type IJob interface {
	Process() error
}

var dispatcherSync sync.Once

// IWorker : Interface for Worker
type IWorker interface {
	Start()
	Stop()
}

// Worker : Default Worker implementation
type Worker struct {
	WorkerPool   chan chan IJob // A pool of workers channels that are registered in the dispatcher
	JobChannel   chan IJob      // Channel through which a job is received by the worker
	Quit         chan bool      // Channel for Quit signal
	WorkerNumber int            // Worker Number
}

// Start : Start the worker and add to worker pool
func (w *Worker) Start() {
	go func() {
		for {
			w.WorkerPool <- w.JobChannel
			select {
			case job := <-w.JobChannel: // Worker is waiting here to receive job from JobQueue
				job.Process() // Worker is Processing the job

			case <-w.Quit:
				// Signal to stop the worker
				return
			}
		}
	}()
}

// Stop : Calling this method stops the worker
func (w *Worker) Stop() {
	go func() {
		w.Quit <- true
	}()
}

func newWorker(workerPool chan chan IJob, number int) IWorker {
	return &Worker{
		WorkerPool:   workerPool,
		JobChannel:   make(chan IJob),
		Quit:         make(chan bool),
		WorkerNumber: number,
	}
}

// Option sets a parameter for the Dispatcher
type Option func(d *Dispatcher)

// SetMaxWorkers sets the number of workers. Default is 10
func SetMaxWorkers(maxWorkers int) Option {
	return func(d *Dispatcher) {
		if maxWorkers > 0 {
			d.maxWorkers = maxWorkers
		}
	}
}

// SetNewWorker sets the Worker initialisation function in dispatcher
func SetNewWorker(newWorker func(chan chan IJob, int) IWorker) Option {
	return func(d *Dispatcher) {
		d.newWorker = newWorker
	}
}

// SetLogger sets the logger in dispatcher
func SetLogger(logger *gologger.CustomLogger) Option {
	return func(d *Dispatcher) {
		d.logger = logger
	}
}

// SetLatencyLogger sets the latency logger for the dispatcher
// This should be set in order to get the max worker count
func SetLatencyLogger(logger gologger.IMultiLogger) Option {
	return func(d *Dispatcher) {
		d.latencyLogger = logger
	}
}

// SetJobQueue sets the JobQueue in dispatcher
func SetJobQueue(jobQueue chan IJob) Option {
	return func(d *Dispatcher) {
		d.JobQueue = jobQueue
	}
}

const maxWorkerGaugeMetricID = "MAX-WORKERS"

// Dispatcher holds worker pool, job queue and manages workers and job
// To submit a job to worker pool, use code
// `dispatcher.JobQueue <- job`
type Dispatcher struct {
	name                  string
	workerPool            chan chan IJob // A pool of workers channels that are registered with the dispatcher
	maxWorkers            int
	newWorker             func(chan chan IJob, int) IWorker
	JobQueue              chan IJob
	workerTracker         chan int
	maxUsedWorkers        int
	latencyLogger         gologger.IMultiLogger
	resetMaxWorkerCount   chan bool
	maxWorkersGaugeMetric *gologger.GaugeMetric
	logger                *gologger.CustomLogger
}

func (d *Dispatcher) run() {
	// starting n number of workers
	for i := 0; i < d.maxWorkers; i++ {
		go func(j int) {
			worker := d.newWorker(d.workerPool, j) // Initialise a new worker
			worker.Start()
		}(i) // Start the worker
	}
	d.trackWorkers() // Start tracking used workers
	go d.dispatch()  // Start the dispatcher
}

func (d *Dispatcher) dispatch() {
	for {
		select {
		case job := <-d.JobQueue:
			// try to obtain a worker job channel that is available.
			// this will block until a worker is idle
			jobChannel := <-d.workerPool
			// track number of workers processing concurrently
			d.workerTracker <- d.maxWorkers - len(d.workerPool)
			// dispatch the job to the worker job channel
			jobChannel <- job
		}
	}
}

func (d *Dispatcher) trackWorkers() {
	go func() {
		for {
			select {
			case <-d.resetMaxWorkerCount:
				// push to logger
				d.logger.LogDebug("setting max workers to zero")
				d.maxUsedWorkers = 0
			case numWorkers := <-d.workerTracker:
				// update used workers
				if numWorkers > d.maxUsedWorkers {
					d.maxUsedWorkers = numWorkers
					d.logger.LogDebug("setting max workers to " + string(numWorkers))
					d.latencyLogger.SetVal(int64(numWorkers), maxWorkerGaugeMetricID, d.name)
				}
			}
		}
	}()
}

//ResetDispatcherMaxWorkerUsed should be called whenever the max worker count needs to be reset
func (d *Dispatcher) ResetDispatcherMaxWorkerUsed() {
	d.logger.LogDebug("Reseting max worker count")
	d.resetMaxWorkerCount <- true
}

// NewDispatcher : returns a new dispatcher. When no options are given, it returns a dispatcher with default settings
// 10 Workers and `newWorker` initialisation and default logger which logs to graylog @ 127.0.0.1:11100.
// This is not in use. So it is prety much useless.
// Set log level to INFO to track max used workers.
func NewDispatcher(dispatcherName string, options ...Option) *Dispatcher {
	d := &Dispatcher{
		name:                dispatcherName,
		maxWorkers:          10,
		newWorker:           newWorker,
		workerTracker:       make(chan int, 100),
		resetMaxWorkerCount: make(chan bool, 10),
	}

	for _, option := range options {
		option(d)
	}
	if d.JobQueue == nil {
		d.JobQueue = make(chan IJob, d.maxWorkers)
	}
	if d.logger == nil {
		d.logger = gologger.NewLogger(gologger.SetLogLevel("ERROR"))
	}
	if d.latencyLogger == nil {
		d.latencyLogger = gologger.NewRateLatencyLogger(gologger.SetLogger(d.logger))
	}
	dispatcherSync.Do(func() {
		maxWorkerGaugeMetric := gologger.NewGaugeMetric(prometheus.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "max_workers",
				Help: "What are the max number of workers used",
			},
			[]string{"DispatcherName"},
		), d.logger)
		d.latencyLogger.AddNewMetric(maxWorkerGaugeMetricID, maxWorkerGaugeMetric)
	})
	d.logger.LogDebug("New dispacther created")
	d.workerPool = make(chan chan IJob, d.maxWorkers)
	d.run()
	return d
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
