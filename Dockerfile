FROM almalinux:latest
WORKDIR /src
EXPOSE 3010
COPY . /src

RUN dnf update -y
RUN dnf module install nodejs:14 -y

RUN yum -y install wget
RUN dnf install ./wkhtmltox-0.12.6-1.centos8.x86_64.rpm -y

RUN npm install -g yarn
RUN yarn install

CMD ["npm", "start"]
