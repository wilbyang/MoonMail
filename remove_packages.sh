#!/usr/bin/env bash

echo "Removing node_modules for each project..."

echo "Removing  packages from MoonMail..."
rm -rf  ./node_modules
echo "Done."

echo "Removing packages from MoonMail/events..."
rm -rf ./events/node_modules
echo "Done."

echo "Removing packages from MoonMail/api..."
rm -rf ./api/node_modules
echo "Done."

echo "Dependencies for all projects have been removed."