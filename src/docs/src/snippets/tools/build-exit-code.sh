# xd build exits with 0 even when a template does not compile: the component is built without its
# render function. In a CI pipeline, fail on the messages instead of the exit code.
xd build 2>&1 | tee build.log
if grep -q "Xaendar:" build.log; then exit 1; fi
