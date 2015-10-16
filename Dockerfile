# Install base OS
FROM ubuntu:14.04

# Author
MAINTAINER Steven Lu <tacticalazn@gmail.com>

# Installing base packages that we need
# to run node with along with our code
RUN apt-get update && apt-get install -y --force-yes --no-install-recommends \
  build-essential \
  curl \
  ca-certificates \
  git \
  lsb-release \
  python-all \
  rlwrap \
  wget

# Next we want to install a compiled verison
# of Node from nodejs.org
ENV NODE_VERSION 4.1.2
ENV NPM_VERSION 3.3.6
RUN \
     cd /opt \
  && wget --quiet https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz \
  && tar -xzf node-v${NODE_VERSION}-linux-x64.tar.gz \
  && mv node-v${NODE_VERSION}-linux-x64 node \
  && cd /usr/local/bin \
  && ln -s /opt/node/bin/* . \
  && rm -f /opt/node-v${NODE_VERSION}-linux-x64.tar.gz \
  && npm install -g npm@${NPM_VERSION}

# Lets install the codebase into the 
# Docker instance
WORKDIR /app
ADD . ./
RUN npm install

# Lets start the application
EXPOSE 3000
ENV NODE_ENV production
CMD npm start
