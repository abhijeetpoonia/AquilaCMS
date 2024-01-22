FROM almalinux:latest
WORKDIR /src
EXPOSE 3010
COPY . /src

RUN dnf update -y
RUN dnf module install nodejs:14 -y

RUN yum -y install wget

RUN npm install -g yarn
RUN yarn install

CMD ["npm", "start"]
