#!/bin/bash
cd $(cd $(dirname $0);pwd)

date >> ./log.txt

termux-wake-lock
node ./index.js >> ./log.txt
termux-wake-unlock
