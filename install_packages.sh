#!/usr/bin/env bash

echo "Installing packages for MoonMail"
npm install --loglevel error
echo "Done."

echo "Installing packages for MoonMail/events"
npm install ./events --prefix ./events --loglevel error
echo "Done."

echo "Installing packages for MoonMail/api"
npm install ./api --prefix ./api --loglevel error
echo "Done."

echo "Dependencies for all projects have finished installing."