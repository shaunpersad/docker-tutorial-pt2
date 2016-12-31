# docker-tutorial-pt2
Part 2 gets more in depth with a real-world workflow, and the usefulness of Docker Compose over Docker.


## On the last episode...

Previously, in [Part 1](https://github.com/shaunpersad/docker-tutorial), a small Hello World Node.js app was created to run with either
Docker or Docker Compose.

Now, we're going to skip a few steps and dive straight into a more real-world app, complete with MongoDB, Redis, and Elasticsearch on the back-end.

In part 3, we will set up a full build process with Gulp, Browserify, React, and SCSS on the front-end. Oh, and tests!

Normally, it takes quite a bit of time to set up and install all these various technologies and to get it working properly on your host.
With Docker Compose, all of this will take minutes, and will work across all your team members.

We will also forego using Docker directly, and use Docker Compose exclusively.

## Using this tutorial

Using your original project from Part 1, simply follow along on the steps. You will be running several commands and modifying your existing files.

There is no need to clone this repository. Use it as a reference for the completed version only.

## Adding nodemon to the mix

One of the first drawbacks of what we built in Part 1 was that each time your source code changed, you had to rebuild the image,
then relaunch the container.

Using [Nodemon](https://github.com/remy/nodemon) can fix this.

### Modifying our Dockerfile

To use Nodemon, we will modify our Dockerfile to add installing Nodemon immediately after pulling the Node image:
```
# install nodemon
npm install -g nodemon
```
Inspect the new Dockerfile in this project, and modify yours accordingly.


## The services

We're going to use Docker Compose to help us manage all our fancy new services.

We will modify our `docker-compose.yml` file to add in the new services that we will require:
```
  tutorial-mongo:
    image: mongo:3.4.1
  tutorial-redis:
    image: redis:3.2.6
  tutorial-elasticsearch:
    image: elasticsearch:5.1.1
```
We will then link these new containers to our app container:
```bash
  app:
    build: .
    image: shaunpersad/docker-tutorial
    command: node index.js
    links:
      - tutorial-mongo
      - tutorial-redis
      - tutorial-elasticsearch
```

Your `docker-compose.yml` should now look like:
```bash
version: '2'
services:
  tutorial-mongo:
    image: mongo:3.4.1
  tutorial-redis:
    image: redis:3.2.6
  tutorial-elasticsearch:
    image: elasticsearch:5.1.1
  app:
    build: .
    image: shaunpersad/docker-tutorial
    command: node index.js
    links:
      - tutorial-mongo
      - tutorial-redis
      - tutorial-elasticsearch
```

If you're wondering where to find the names of the images you need, welcome to [Docker Hub](https://hub.docker.com/explore/). It's like going shopping!


## Some new packages

Now we need to add some new packages from NPM. In the first tutorial, we used the official node image to create a terminal to generate the `package.json`.
We will take a similar approach, but using our already-built image, so that the modules we install will go directly into the container's volume:
```bash
docker run -it --rm -v $(pwd):/usr/src/app -w /usr/src/app shaunpersad/docker-tutorial /bin/bash
```
Notice now that the image we are using for the terminal is `shaunpersad/docker-tutorial`.

For convenience, this command is saved in the `scripts` directory in `app-terminal.sh`.

Now let's start installing!
```bash
npm install async lodash express body-parser mongoose redis elasticsearch react --save
```
The above are the libraries that our app will need.


## More useful source code

We're going to create a "simple" registry of people. We should be able to add, search for, and display people. 
We will submit people via a form, send it to an express app, which will then save it in MongoDB, and mirror it in Elasticsearch.
Whenever we search for someone, the express app will hit Elasticsearch for the results, and cache it in Redis. With this simple of an app,
MongoDB is playing a fairly useless middleman, though in real apps that ususually is not the case, as you tend to not want Elasticsearch
as your primary database.

This part of the tutorial is focusing only on the front-end, so we won't worry about React and the build process just yet.

### Organization

To better organize our codebase that's about to explode with new stuff, let's add a `src` directory.

## Rebuilding our latest changes

Run `docker-compose build` to rebuild our app image.