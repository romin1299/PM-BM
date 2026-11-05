@echo off
rem ---------------------------------------------------------------------------
rem Production launcher.
rem
rem Run from this file's own folder whatever started it: a shortcut, a service
rem or Task Scheduler otherwise starts node in C:\Windows\System32, where it
rem finds no config.env and cannot reach the database.
rem
rem Starts cluster.js, which runs app.js (plain HTTP on port 7000). To serve
rem TLS from node instead, add:  set CLUSTER_ENTRY=appServer.js
rem ---------------------------------------------------------------------------
cd /d "%~dp0"

rem ---------------------------------------------------------------------------
rem MEMORY BUDGET - this server has 8 GB of RAM
rem
rem Two things make this tighter than it looks:
rem
rem   1. --max-old-space-size is PER PROCESS, not for the application. The
rem      workers inherit NODE_OPTIONS from this file, so the figure below is
rem      multiplied by the number of processes. Measured: 2048 with 4 workers
rem      gave 2096 MB x 5 processes = 10,480 MB of heap ceiling.
rem   2. config.env points at mongodb://127.0.0.1, so MongoDB is on this box
rem      too. WiredTiger's default cache is half of (RAM - 1 GB), which is
rem      3,584 MB here, before mongod's own overhead.
rem
rem So the 8 GB divides roughly:
rem
rem   Windows                        ~1,500 MB
rem   MongoDB (cache + overhead)     ~4,000 MB
rem   -------------------------------------------
rem   left for node                  ~2,700 MB
rem
rem 1024 MB x 2 workers + the primary is a 3,216 MB ceiling, and the primary
rem only supervises - it sits near 40 MB - so the real worst case is about
rem 2,400 MB including off-heap buffers. That fits.
rem
rem Worth doing on the server as well: cap WiredTiger in mongod.cfg
rem (storage.wiredTiger.engineConfig.cacheSizeGB: 2). That hands node another
rem 1.5 GB and stops the two of them bidding for the same pages.
rem
rem If MongoDB ever moves to its own machine, node can have ~5.5 GB here:
rem raise this to 2048 and the workers to 2.
rem ---------------------------------------------------------------------------
set NODE_OPTIONS=--max-old-space-size=1536

rem ---------------------------------------------------------------------------
rem Workers sharing port 7000. A worker that dies is replaced in about a second
rem while the others keep serving, instead of the whole application going down.
rem Set to a number, or "max" for one per core. 1 runs exactly as a plain
rem `node app.js` does.
rem
rem Two, not four, for two independent reasons:
rem
rem   - Memory. Four workers would have to drop to about 512 MB each to stay
rem     inside the budget above, and the heavy dashboards hold tens of MB per
rem     in-flight request.
rem   - Throughput. On Windows, node's cluster leaves connection scheduling to
rem     the OS (schedulingPolicy = SCHED_NONE) and it spreads them unevenly:
rem     measured, 4 workers over 400 requests at concurrency 40 went
rem     221 / 172 / 4 / 3. Two workers did 98% of that work anyway, so the
rem     other two cost memory without earning throughput.
rem
rem Two still gives the point of running a cluster at all: one worker dying
rem costs half the traffic for a second, not all of it.
rem
rem Note that leaving NODE_OPTIONS unset would NOT be safer - node 16's own
rem default is 2096 MB per process, so four workers would sit at an 8.4 GB
rem ceiling on an 8 GB machine and Windows would start paging before V8 ever
rem decided to collect. The limit below exists to make V8 collect first.
rem ---------------------------------------------------------------------------
set CLUSTER_WORKERS=2

rem How long one request may occupy a worker before it is given up on.
set REQUEST_TIMEOUT_MS=120000

node cluster.js
pause
