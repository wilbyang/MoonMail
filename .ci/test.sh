#!/usr/bin/env bash

source .ci/detect-changed-services.sh && detect_changed_services && echo $changed_services
echo "changed_services: $changed_services"
for service in $changed_services
do
  echo "-------------------Running tests for $service---------------------"
  cd $service
  yarn install && yarn test
  if [[ $service == "lists-microservice" ]]; then
    wget ${ES_DOWNLOAD_URL}
    tar -xzf elasticsearch-${ES_VERSION}.tar.gz
    ./elasticsearch-${ES_VERSION}/bin/elasticsearch &
    wget -q --waitretry=3 --retry-connrefused -T 10 -O - http://127.0.0.1:9200
    yarn run test:integration
    #if [[ $TRAVIS_PULL_REQUEST == "false" ]]; then
      # yarn run test:system
    #fi
  fi
  cd ..
done
