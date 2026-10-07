@echo off
rem Run from this file's own folder, whatever launched it. A shortcut, a
rem service or Task Scheduler otherwise starts node in C:\Windows\System32,
rem where it finds no config.env and cannot reach the database.
cd /d "%~dp0"
start %windir%\system32\cmd.exe /k node app.js
