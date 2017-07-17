# Dashkiosk

The full documentation is available on [ReadTheDocs][] and the original repository from [vincentbernat](https://github.com/vincentbernat/dashkiosk).

[ReadTheDocs]: https://dashkiosk.readthedocs.io

Here is a demonstration video:

[![Dashkiosk demo](https://img.youtube.com/vi/Vb4BvEzoYOU/0.jpg)](https://www.youtube.com/watch?v=Vb4BvEzoYOU "Dashkiosk demo")

# Docker

There is a `Dockerfile` to run *Dashkiosk* inside Docker with Chromecast support. You can
run this container like this:
	
	docker build -t dashkiosk:dev1 .
    docker run -d --net=host -e "chromecast__enabled=1" -e "chromecast__receiver=http://10.30.21.20:8337/receiver" -e "port=8337" --restart=always --name=dashkiosk dashkiosk:dev1

It's important to use `--net=host`, otherwise Chromecast devices can't be discovered. This option does not work with "Docker for Mac" and probably also not with "Docker for Windows" (see [#68](https://github.com/docker/for-mac/issues/68)). 
