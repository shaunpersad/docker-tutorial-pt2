# docker-tutorial-pt2
Part 2 gets more in depth with a real-world workflow, and the usefulness of Docker Compose over Docker.


## On the last episode...

Previously, in [Part 1](https://github.com/shaunpersad/docker-tutorial), a small Hello World Node.js app was created to run with either
Docker or Docker Compose.

Now, we're going to skip a few steps and dive straight into a more real-world app, complete with MongoDB, Redis, and Elasticsearch on the back-end.

In Part 3, we will set up a full build process with Gulp, Browserify, React, and SCSS on the front-end. Oh, and tests!

Normally, it takes quite a bit of time to set up and install all these various technologies and to get it working properly on your host.
With Docker Compose, all of this will take minutes, and will work across all your team members.

We will also forego using Docker directly, and use Docker Compose exclusively. Particularly, we will be heavily modifying the `docker-compose.yml` file.
For further reading on how Docker Compose works with `docker-compose.yml`, go here: https://docs.docker.com/compose/reference/overview/

## Using this tutorial

Using your original project from Part 1, simply follow along on the steps. You will be running several commands and modifying your existing files.

There is no need to clone this repository. Use it as a reference for the completed version only.


## Step 1 - A better source-code workflow

One of the first drawbacks of what we built in Part 1 was that each time your source code changed, you had to rebuild the image,
then relaunch the container.

Using [Nodemon](https://github.com/remy/nodemon) and [mounting a volume](https://docs.docker.com/engine/tutorials/dockervolumes/#/data-volumes) can fix this.

Nodemon listens for changes to your source code, and reloads your app. It even knows when you add new files and directories. One limitation that I did notice was that
it did not know when files were deleted.

A data volume is a means of persisting data for a container. It also acts as a shared folder from host to container. In Part 1 we were just copying the source code to the container,
but now we've given the container a place on our host to access the source directly. This is also beneficial for file watching.

With Vagrant, one of the biggest problems our team begun to have with one of our largest apps was file watching inside of a VM...it was slow. Super slow. 10-30 seconds slow.
The reason for this slowness was that the VM could not use the host's native OS file watching, and therefore had to poll all of the files it watched.

Docker data volumes don't have this limitation. Nodemon and any other file watchers (which we will implement in Part 3 for our build process) are free to use the host OS's file watching.

### Adding nodemon

To use Nodemon, we will modify our Dockerfile to add installing Nodemon immediately after pulling the Node image:
```Dockerfile
# install nodemon
RUN npm install -g nodemon
```
Inspect the new Dockerfile in this project, and modify yours accordingly.

In our `docker-compose.yml` file, we will then need to change `node index.js` to `nodemon index.js`.

Run `docker-compose build` to rebuild our app image.

With any luck, this will be the **last** time we need to rebuild our image (for a while anyway).

### Adding a data volume

In our `docker-compose.yml`, we need to add the following under the `app` service:
```yaml
    volumes:
      - .:/usr/src/app
```
Notice that the format is {host_directory}:{container_directory}.

Our new file should look like:
```yaml
version: '2'
services:
  app:
    build: .
    image: shaunpersad/docker-tutorial
    command: nodemon index.js
    volumes:
      - .:/usr/src/app
```


## Step 2 - Adding the services

We're going to use Docker Compose to help us manage all our fancy new services.

We will modify our `docker-compose.yml` file to add in the new services that we will require:
```yaml
  tutorial-mongo:
    image: mongo:3.4.1
    ports:
      - '27017:27017'
  tutorial-redis:
    image: redis:3.2.6
    ports:
      - '6379'
  tutorial-elasticsearch:
    image: elasticsearch:5.1.1
    ports:
      - '9200:9200'
```
We will then link these new containers to our app container:
```yaml
  app:
    build: .
    image: shaunpersad/docker-tutorial
    command: nodemon index.js
    volumes:
      - .:/usr/src/app
    links:
      - tutorial-mongo
      - tutorial-redis
      - tutorial-elasticsearch
```

Your `docker-compose.yml` should now look like:
```yaml
version: '2'
services:
  tutorial-mongo:
    image: mongo:3.4.1
    ports:
      - '27017:27017'
  tutorial-redis:
    image: redis:3.2.6
    ports:
      - '6379'
  tutorial-elasticsearch:
    image: elasticsearch:5.1.1
    ports:
      - '9200:9200'
  app:
    build: .
    image: shaunpersad/docker-tutorial
    command: nodemon index.js
    volumes:
      - .:/usr/src/app
    links:
      - tutorial-mongo
      - tutorial-redis
      - tutorial-elasticsearch
```

If you're wondering where to find the names of the images you need, welcome to [Docker Hub](https://hub.docker.com/explore/). Adding big scary tech is easier than shopping on Amazon!

### Accessing these services

Typically when you're working with tech like MongoDB, Elasticsearch, and Redis, you'll want to access them to view and modify
their data directly.  E.g. visualizing your data in a GUI like MongoHub, or running commands in a CLI.

Even though these services live inside of containers, accessing them is quite easy.

##### MongoDB

Notice that for `tutorial-mongo`, we specified the `ports` "27017:27017". This is of the format {host_port}:{container_port}, and means to expose the port 27017 in the container (the default MongoDB port), and forward it to port 27017 on the host.

This means that you can access mongo from your host machine from its usual port! You can alternatively change the host port to anything else you'd like.

Therefore, connecting to the mongo instance from your host machine is as simple as connecting to `localhost:27017`.

##### Elasticsearch

The same concept applies to Elasticsearch as it does for MongoDB, except it uses port 9200.

##### Redis CLI

Redis is a bit different as we don't necessarily need to access it locally. However, may want to access `redis-cli` in the terminal,
in order to run commands. To do that, make sure the redis container is already up and running (if you ran `docker-compose up`, then it is),
then we're going to start *another instance* of that redis container, but execute the `redis-cli` command instead, and have it connect to the already running container:
```bash
docker-compose run tutorial-redis redis-cli -h tutorial-redis
```
The above says `docker-compose run {service} {command}`, where the {service} is our defined "tutorial-redis",
and the command is `redis-cli`. The "-h" flag is actually a flag on `redis-cli`, not `docker-compose`, and it tells `redis-cli`
to use "tutorial-redis" as the hostname (instead of localhost, as is default).

For convenience, this command is saved in the `scripts` directory as `redis-cli.sh`.

If that last bit about hostnames didn't make sense, don't worry it will soon. It's another magical feature of Docker,
where the service names we use in `docker-compose.yml` can actually be used as the hostnames of those containers to connect to them.

We'll be using that concept in our source code when we get to it.

##### Mongo Shell

The above concept also works to connect to the mongo shell:
```bash
docker-compose run tutorial-mongo mongo --host tutorial-mongo
```
For convenience, this command is saved in the `scripts` directory as `mongo-shell.sh`.


## Step 3 - Installing some new packages

Now we need to add some new packages from NPM. In the first tutorial, we used the official node image to create a terminal to generate the `package.json`.
We will take a similar approach, but using our already-built image, so that the modules we install will go directly into the container's volume, and we won't need to rebuild our image:
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


## Step 4 - Writing more useful source code

We're going to create a "simple" registry of people. We should be able to add, search for, and display people. 
We will submit people via a form, send it to an express app, which will then save it in MongoDB, and mirror it in Elasticsearch.
Whenever we search for someone, the express app will hit Elasticsearch for the results, and cache it in Redis. With this simplistic of an app,
MongoDB is playing a fairly useless middleman, though in real apps that ususually is not the case, as you tend to not want Elasticsearch
as your primary database.

This part of the tutorial is focusing only on the front-end, so we won't worry about React and the build process just yet.

### Organization

To better organize our codebase that's about to explode with new stuff, let's add a `src` directory.
In it, we will have the following directories and files:
- *src*
    - *api*: API route handlers
        - *createUser*: POST /users to create a user
        - *getUser*: GET /users/{userId} to get a specific user
        - *getUsers*: GET /users with optional ?search={query} to get a list of users
    - *models*: Database models
        - *getUserModel: gets the User model from Mongoose
    - *services*: wrappers around our external services (MongoDB, Elasticsearch, Redis)
        - *elasticsearch*: will create an Elasticsearch connection, and create mappings if necessary
        - *mongo*: will create a MongoDB connection
        - *redis*: will create a Redis connection
    - *utils*: utility functions
        - *apiResponse*: will respond to API requests with JSON, and handle errors appropriately
        - *healthCheck*: will wait for our external services to be ready before allowing the app to proceed
        - *remember*: will allow us to easily store data in Redis
        - *unRemember*: will allow us to easily remove data from Redis
- *index.js*: Still our entry point into the app.

This is by no means a large-scale framework, but it will do the job in a non-cluttered, reasonable way.

### Health Check

Inspect `index.js`. In it, we start out by `require`ing our libraries, and then all our `src` items. Then we get to this `util.healthCheck` function.

Remember that with Docker Compose, we are able to start all our containers at the same time. One side effect of this behavior is that not all our services will be
ready when our app starts. In fact, they usually never are, as they require startup time. Attempting to start your app without these connections
will result in errors, so we need a mechanism that will allow us to wait for these services to be ready before we do anything meaningful in our app.

So, our `healthCheck` does just that. Feel free to inspect the code, but to spare you the suspense, it simply repeatedly attempts to make
connections to your external services until it succeeds, at which point it calls the callback, which in our case, .