GOPATH=$(PWD)/build
export GOPATH

# Verbosity
V=0
V_gobuild = $(v_gobuild_$(V))
v_gobuild_0 = @echo "  GO BUILD " $@; go build
v_gobuild_1 = go build -v -x
V_goget = $(v_goget_$(V))
v_goget_0 = @echo   "  GO GET   " $@; go get
v_goget_1 = go get -v
V_gocmd = $(v_gocmd_$(V))
v_gocmd_0 = @echo   "  GO" $(shell echo $@ | tr a-z A-Z); go
v_gocmd_1 = go

# Compute list of dependencies. We assume that built-in dependencies
# are those without a dot before the first `/'.
DEPS=$(shell go list -f '{{join .Deps "\n"}}' ./src/... | grep '^[a-z]*\.')

# Build proxy
all: $(PWD)/build/proxy
$(PWD)/build/proxy: deps fmt vet
	$(V_gobuild) -o $@ ./src

# Grab dependencies
deps: $(DEPS)
$(DEPS):
	$(V_goget) $@

# Cleanup
clean:
	rm -rf $(GOPATH)

# Wrapper around go commands
fmt:
	$(V_gocmd) fmt ./src/...
vet:
	$(V_gocmd) vet ./src/...
doc:
	$(V_gocmd)doc -http=:8000 -index


.PHONY: all deps clean fmt vet doc
