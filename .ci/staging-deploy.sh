#!/usr/bin/env bash

export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID_DEV
export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY_DEV
source .ci/detect-changed-services.sh && detect_changed_services && echo $changed_services
echo "changed_services: $changed_services"

auto_deployable_services="events-router,"
if [[ $TRAVIS_PULL_REQUEST == "false" ]]; then
  for service in $changed_services
  do
    echo "-------------------Running packaging for $service---------------------"
    if [[ $auto_deployable_services = *"$service"* ]]; then
      cd $service && yarn install && yarn deploy; cd ..
    fi
  done
fi
