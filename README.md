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


## Goals

- To pull together several back-end services to work together in harmony
- To create an effective workflow that doesn't get in your way
- To gain a deeper understanding of Docker Compose and how it can help orchestrate complex setups


## Step 1 - A better source-code workflow

One of the first drawbacks of what we built in Part 1 was that each time your source code changed, you had to rebuild the image,
then relaunch the container.

Using [Nodemon](https://github.com/remy/nodemon) and [mounting a volume](https://docs.docker.com/engine/tutorials/dockervolumes/#/data-volumes) can fix this.

Nodemon listens for changes to your source code, and reloads your app. It even knows when you add new files and directories. One limitation that I did notice was that
it did not know when files were deleted.

A data volume is a means of persisting data for a container. It also acts as a shared folder from host to container. In Part 1 we were just copying the source code to the container,
but now we've given the container a place on our host to access the source directly. This is also beneficial for file watching.

Also, with Vagrant, one of the biggest problems our team begun to have with one of our largest apps was file watching inside of a VM...it was slow. Super slow. 10-30 seconds slow.
The reason for this slowness was that the VM could not use the host's native OS file watching, and therefore had to poll all of the files it watched.

Docker data volumes don't have this limitation. Nodemon and any other file watchers (which we will implement in Part 3 for our build process) are free to use the host OS's file watching.

### Adding nodemon

To use Nodemon, we will modify our Dockerfile to add installing Nodemon immediately after pulling the Node image:
```Dockerfile
# install nodemon
RUN npm install -g nodemon
```
Our final Dockerfile should look like this:
```Dockerfile
# Node.js version
FROM node:6.9.2

# install nodemon
RUN npm install -g nodemon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# get the npm modules that need to be installed
COPY package.json /usr/src/app/

# install npm modules
RUN npm install

# copy the source files from host to container
COPY . /usr/src/app
```

In our `docker-compose.yml` file, we will then need to change `node index.js` to `nodemon index.js`.

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
their data directly.  E.g. visualizing your data in a GUI like [MongoHub](https://github.com/jeromelebel/MongoHub-Mac), or running commands in a CLI.

Even though these services live inside of containers, accessing them is quite easy.

##### MongoDB

Notice that for `tutorial-mongo`, we specified the `ports` "27017:27017". This is of the format {host_port}:{container_port}, and means to expose the port 27017 in the container (the default MongoDB port), and forward it to port 27017 on the host.

This means that you can access mongo from your host machine from its usual port! You can alternatively change the host port to anything else you'd like.

Therefore, connecting to the mongo instance from your host machine is as simple as connecting to `localhost:27017`.

##### Elasticsearch

The same concept applies to Elasticsearch as it does for MongoDB, except it uses port 9200.

##### Redis CLI

Redis is a bit different as we don't necessarily need to access it locally. However, may want to access `redis-cli` in the terminal, in order to run commands. To do that, make sure the redis container is already up and running, then we're going to start *another instance* of that redis container, but execute the `redis-cli` command instead, and have it connect to the already running container:
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


## Step 3 - NPM package workflow

We will now attempt to install some new packages from NPM. In the first tutorial, we used the official node image to create a terminal to generate the `package.json`. We will take a similar approach to modify the `package.json` file. 

However, before we do that, we need to do some initial configuration. Why? Because of our use of volumes in Step 1.

### Setup

Here's a breakdown of our current situation:
- When our image is built, it runs `npm install` based on our `package.json` file, and the copies over our source code into the container. This is all well and good, and is a good method for creating the self-contained image that we want, since, when we later share this image with others, they don't need to have our source code or anything else to run the image.
- The problem with our image building was that we would have to rebuild the image each time our source code changed, so we implemented a volume in Step 1 that allowed the running container to directly access the source code on our host. In the container's filesystem, the "original" copied source code was overlaid by the files in the mounted volume. This enabled us to not have to rebuild our image just to access our latest source code in the container.
- Now, the _problem_ with our volume _solution_ is that our volume takes everything from our project root and mounts it, including our host's `node_modules`, or lack thereof. Therefore, the original `node_modules` in the container that was built by the image is no longer present when our source-code volume is mounted.

The solution to end all problems is to mount _another_ volume, one which restores the original `node_modules` that results from building the image. We do that in the `docker-compose.yml`:
```yaml
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
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
      - /usr/src/app/node_modules
    links:
      - tutorial-mongo
      - tutorial-redis
      - tutorial-elasticsearch
``` 

How and why does this work? Because a feature of volumes is that [if the container’s base image contains data at the specified mount point, that existing data is copied into the new volume upon volume initialization](https://docs.docker.com/engine/tutorials/dockervolumes/#/data-volumes).

And so, specifying the original `node_modules` directory as a volume actually overlays that directory on top the source code volume that we specified, restoring `node_modules` to its original glory.

A more visual explanation can be found [here](http://jdlm.info/articles/2016/03/06/lessons-building-node-app-docker.html#the-nodemodules-volume-trick).

### Installing

 Recall that the command was saved in `scripts/terminal.sh`, so you can run that script directly:
```bash
sh scripts/terminal.sh
```
or run the full command:
```bash
docker run -it --rm -v $(pwd):/usr/src/app -w /usr/src/app shaunpersad/docker-tutorial /bin/bash
```
Now let's start installing!
```bash
npm install async lodash express body-parser mongoose redis elasticsearch --save
```
The above are the libraries that our app will need. `exit` when done.

We now have a modified `package.json` file waiting for us on our host.


## Step 4 - A better app

We're going to create a "simple" registry of people. We should be able to add, search for, and display people. 
We will submit people via a form, send it to an express app, which will then save it in MongoDB, and mirror it in Elasticsearch.
Whenever we search for someone, the express app will hit Elasticsearch for the results, and cache it in Redis. With this simplistic of an app,
MongoDB is playing a fairly useless middleman, though in real apps that usually is not the case, as you tend to not want Elasticsearch
as your primary database.

This part of the tutorial is focusing only on the back-end, so we won't worry about React and the build process just yet.

### Organization

To better organize our codebase that's about to explode with new stuff, let's add a `src` directory.
In it, we will have the following directories and files:
- *src/*
    - *api/*: API route handlers
        - *createUser.js*: POST /users/create to create a user
        - *editUser.js*: POST|PUT /users/{userId}/edit to edit a user
        - *getUser.js*: GET /users/{userId} to get a specific user
        - *getUsers.js*: GET /users with optional ?search={query} to get a list of users
        - *removeUser.js*: POST|DELETE /users/{userId}/remove to remove a user
    - *models/*: Database models and tying all three database services together
        - *getUserModel.js: gets the User model from Mongoose
    - *services/*: wrappers around our external services (MongoDB, Elasticsearch, Redis)
        - *elasticsearch*: will create an Elasticsearch connection, and create mappings if necessary
        - *mongo.js*: will create a MongoDB connection
        - *redis.js*: will create a Redis connection
    - *utils/*: utility functions
        - *apiResponse.js*: will respond to API requests with JSON, and handle errors appropriately
        - *healthCheck.js*: will wait for our external services to be ready before allowing the app to proceed
        - *remember.js*: will allow us to easily store data in Redis
        - *unRemember.js*: will allow us to easily remove data from Redis
- *index.js*: Still our entry point into the app.

This is by no means a large-scale framework, but it will do the job in a non-cluttered, reasonable way.

### Health Check

Inspect `index.js`. In it, we start out by `require`ing our libraries, and then all our `src` items. Then we get to this `util.healthCheck` function.

Remember that with Docker Compose, we are able to start all our containers at the same time. One side effect of this behavior is that not all our services will be
ready when our app starts. In fact, they usually never are, as they require startup time. Attempting to start your app without these connections
will result in errors, so we need a mechanism that will allow us to wait for these services to be ready before we do anything meaningful in our app.

So, our `healthCheck` does just that. Feel free to inspect the code, but to spare you the suspense, it simply repeatedly attempts to make
connections to your external services until it succeeds, at which point it calls the callback, which in our case, sets up our routes.

### Connecting to other containers

Recall that earlier we mentioned that "the service names we use in `docker-compose.yml` can actually be used as the hostnames of those containers to connect to them".

As an example, if you create a service names "my-service" in your `docker-compose.yml`, other containers can make requests to "http://my-service:{some_exposed_port}" to talk to it!

This concept is used in the functions found in `src/services` to connect to MongoDB, Elasticsearch, and Redis.

Mongo:
```js
mongoose.connect('mongodb://tutorial-mongo/docker_tutorial');
```
Elasticsearch:
```js
const client = new elasticsearch.Client({
    host: 'tutorial-elasticsearch:9200',
    log: []
});
```
Redis:
```js
const client = redis.createClient({
    host: 'tutorial-redis'
});
```
Also notice that in our `docker-compose.yml`, we've got some port definitions to expose the default ports for these services.
It doesn't matter that we're using the default ports in our code (and in the case of Elasticsearch, we actually hard-code it),
because by default, our containers create their own private network. Only MongoDB and Redis are explicitly accessible
to the outside world, because we've defined ports on our host to talk to them, but we can change these ports to anything we wish,
without having to change our source code.

For example, for Elasticsearch, we have this:
```yaml
    ports:
      - '9200:9200'
```
We could change it to this:
```yaml
    ports:
      - '5000:9200'
```
Which would not affect our source at all, because the containers would still be able to talk to it at 9200, but if we wanted to talk to Elasticsearch from our host, we'd have to use 5000 instead.

### Writing the code

I encourage you to explore each file in this project, starting from `index.js`, and tracing things to the `src` directory. When you're done, copy the `src` directory and the `index.js` file from this project into your own, and you're good to go!

The gist of what happens is as follows: 
- We connect to our services, then assign our routes and handles with express.
- API requests will come in and act upon the User model we have defined. 
    - Using Mongoose's model events, we can trigger things to happen whenever a model is created, edited, or deleted.
    - This allows us to sync our data between MongoDB, Elasticsearch, and Redis.
    - Whenever a model is created or edited, its data is automatically put into Elasticsearch, and the relevant Redis caches are cleared.
    - Whenever a model is deleted, its data is automatically removed from Elasticsearch, and the relevant Redis caches are cleared.

### Exposing a port

The app we're writing is a web server, so we need to provide it with a port to listen to. The source code in `index.js` is asking for 8080, so let's give it:
```yaml
  app:
    build: .
    image: shaunpersad/docker-tutorial
    command: nodemon index.js
    environment:
      NODE_ENV: development
    ports:
      - '8080:8080'
    volumes:
      - .:/usr/src/app
    links:
      - tutorial-mongo
      - tutorial-redis
      - tutorial-elasticsearch
```
Notice also the new "environment" variables. It's just good practice to define the NODE_ENV explicitly.
In a later tutorial we'll see how to extend `docker-compose.yml` for dev, staging, and production.

Your new `docker-compose.yml` should now look like:
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
    environment:
      NODE_ENV: development
    ports:
      - '8080:8080'
    volumes:
      - .:/usr/src/app
    links:
      - tutorial-mongo
      - tutorial-redis
      - tutorial-elasticsearch
```

## Step 5 - Using the API

Once all the code is in place, it's the moment of truth. Run `docker-compose up --build`, and watch the magic happen.

Normally, you'll just need to run `docker-compose up`, but since we've already got an existing image from Part 1 named `shaunpersad/docker-tutorial`, and we've made changes to our `Dockerfile` as well as installed new NPM packages, we need to pass in the `--build` flag to alert docker-compose to rebuild the image.

You'll probably see a lot of console output. Containers tend to be noisy on startup, and we've got 3 big technologies all starting up at the same time.
If everything went according to plan, one of the last outputs you should see should be:
```bash
app_1 | Listening on 8080.
```
If this is true, hooray, your app is up!

Navigate to `http://localhost:8080`, and you'll be presented with our old friend "Hello world!".

At this point, you may want to turn off the extra logs from the other noisy containers. You can do that with:
```yaml
    logging:
      driver: "none"
```

Your final `docker-compose.yml` should then be:

```yaml
version: '2'
services:
  tutorial-mongo:
    image: mongo:3.4.1
    ports:
      - '27017:27017'
    logging:
      driver: "none"
  tutorial-redis:
    image: redis:3.2.6
    ports:
      - '6379'
    logging:
      driver: "none"
  tutorial-elasticsearch:
    image: elasticsearch:5.1.1
    ports:
      - '9200:9200'
    logging:
      driver: "none"
  app:
    build: .
    image: shaunpersad/docker-tutorial
    command: nodemon index.js
    environment:
      NODE_ENV: development
    ports:
      - '8080:8080'
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
    links:
      - tutorial-mongo
      - tutorial-redis
      - tutorial-elasticsearch
```

Now you're free to try out the API. Fire up [Postman](https://www.getpostman.com/) or some other REST client, and start making requests!

#### Create a user

We've got no data, so let's make some.

URL: http://localhost:8080/users/create BODY: firstName = Shaun, lastName = Persad
```bash
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -d 'firstName=Shaun&lastName=Persad' "http://localhost:8080/users/create"
```

#### Get all users
URL: http://localhost:8080/users
```bash
curl -X GET -H "Content-Type: application/x-www-form-urlencoded" "http://localhost:8080/users"
```
Try repeating this request. The second time around should be faster, since it will be cached in Redis.

#### Create another user
URL: http://localhost:8080/users/create BODY: firstName = Tim, lastName = Coker
```bash
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -d 'firstName=Tim&lastName=Coker' "http://localhost:8080/users/create"
```

#### Search users
URL: http://localhost:8080/users QUERY: search = Sh
```bash
curl -X GET -H "Content-Type: application/x-www-form-urlencoded" "http://localhost:8080/users?search=sh"
```
Try repeating this request. The second time around should be faster, since it will be cached in Redis.

You get the picture!


## Step 6 - Managing node_modules

As was the case with generating the `package.json` file in Part 1, the intent of using the temporary terminal in Step 3 was to not rely
on having Node or NPM available on our host just to run a node/npm command. However, the side effect of what we've done at the start of Step 3
is that now we have some modules "physically" present in our `node_modules` directory on our host. Our Dockerfile ignores `node_modules` (thanks to the `.dockerignore` we set up in Part 1) on our host, and builds its own `node_modules` from the information in `package.json`, so these host modules are effectively meaningless, and can be ignored (or removed if you're a bit OCD).

Now, whenever we update our `package.json` (either we install new modules ourselves as described in Step 3, or we `git pull` and find that we have an updated `package.json`, or simply modify `package.json` manually), we will need to stop whatever's currently running, and rebuild our image.

We can accomplish that with the following commands:
```bash
docker-compose down
docker-compose up --build
```
This will effectively be the only times you need to rebuild your image in your workflow, unless there happen to be new changes to your `Dockerfile`.


## Congratulations!

You survived Part 2! It was intense, but you can now say you've successfully created a complex back-end system using Docker Compose.
All it takes to run is a single command too! Try editing the source code while the app is running. Nodemon will do its thing and reload the app automatically.
No more rebuilding the image each time!

The best part is whoever pulls down your completed source code can build everything all at once and run it, just by running `docker-compose up`.

It's pretty awesome, isn't it?

In Part 3, we'll explore a front-end workflow. Stay tuned!
